import {
    CacheEntry,
    DeleteParams,
    GetParams,
    ILeaf,
    LeafConfig,
    PatchParams,
    PostParams,
    PutParams,
    QueryReturnType,
    RequestParams
} from "./types/types";
import {
    constructQueryParams,
    getResponseData,
    mergeSignals,
    shouldRetry,
    sleep
} from "./utils/utils";


class Leaf implements ILeaf {
    private readonly baseUrl: string;
    private readonly config: LeafConfig;
    private readonly cache?: Map<string, CacheEntry>;
    private readonly pendingRequests: Map<string, Promise<any>>;

    constructor(baseUrl?: string, config?: LeafConfig) {
        this.baseUrl = baseUrl ? baseUrl : "";
        this.config = {
            retry: 0,
            retryDelay: 0,
            cache: false,
            cacheTime: config?.cacheTime ?? 1000 * 60 * 5,
            ...config
        };
        if (this.config.cache) {
            this.cache = new Map<string, CacheEntry>();
        }
        this.pendingRequests = new Map<string, Promise<any>>();
    }

    private createTimeoutSignal(timeout: number): [AbortSignal, number] {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort("TIMEOUT"), timeout);
        return [controller.signal, timer];
    }

    private useCache(method: string, fullUrl: string): { shouldCache: boolean, cacheHit: boolean } {
        if (!this.config.cache || !this.config.cacheTime || !this.cache) return { shouldCache: false, cacheHit: false };

        if (method !== "GET") {
            this.cache.clear();
            return { shouldCache: false, cacheHit: false };
        }

        if (this.cache.has(fullUrl)) {
            const entry = this.cache.get(fullUrl);
            const isValid = Date.now() - entry!.time <= this.config.cacheTime;

            if (isValid) {
                return { shouldCache: false, cacheHit: true };
            }

            this.cache.delete(fullUrl);
        }

        return { shouldCache: true, cacheHit: false };
    }

    private useTimeout() {
        if (this.config.timeout) {
            return this.createTimeoutSignal(this.config.timeout);
        }

        return [undefined, undefined] as const;
    }

    private requestCleanup(fullUrl: string, timeoutTimer?: number) {
        if (this.pendingRequests.has(fullUrl)) {
            this.pendingRequests.delete(fullUrl);
        }
        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
        }
    }

    private buildUrl(baseUrl: string, url: string, queryParams: string) {
        return baseUrl + url + queryParams;
    }

    private async request<T>({ url, method="GET", headers, body, params, signal }: RequestParams): QueryReturnType<T> {
        const queryParams = constructQueryParams(params);
        let combinedSignal;

        const [timeoutSignal, timeoutTimer] = this.useTimeout();

        if (timeoutSignal && signal) {
            combinedSignal = mergeSignals([timeoutSignal, signal]);
        }

        const fullUrl = this.buildUrl(this.baseUrl, url, queryParams);

        const cacheState = this.useCache(method, fullUrl);

        if (cacheState.cacheHit) {
            return this.cache!.get(fullUrl)!.data as T;
        }

        if (method === "GET" && this.pendingRequests.has(fullUrl)) {
            return this.pendingRequests.get(fullUrl);
        }

        const requestPromise = fetch(fullUrl, {
            method: method,
            headers: {
                ...this.config.headers,
                ...headers,
                ...(body && !(body instanceof FormData) && {
                    "Content-Type": "application/json"
                }),
            },
            body: body ? body instanceof FormData ? body : JSON.stringify(body) : undefined,
            signal: combinedSignal ?? timeoutSignal ?? signal,
        })
            .then((response) => getResponseData<T>(response));

        if (method === "GET") {
            this.pendingRequests.set(fullUrl, requestPromise);
        }

        requestPromise.finally(() => {
            this.requestCleanup(fullUrl, timeoutTimer);
        });

        const data = await requestPromise;

        if (cacheState.shouldCache) {
            this.cache!.set(fullUrl, {
                time: Date.now(),
                data
            });
        }

        return data;
    }

    private async requestWithRetry<T>({ url, method="GET", headers, body, params, signal }: RequestParams): QueryReturnType<T> {
        let lastError: unknown;

        for (let i = 0; i <= this.config.retry!; i++) {
            try {
                const data = await this.request({ url, method, headers, body, params, signal });
                return data as T;
            }
            catch (e) {
                lastError = e;
                if (!shouldRetry(e as Error, signal)) {
                    throw lastError;
                }
                await sleep((this.config.retryDelay! * 2**i) + Math.random() * 10);
            }
        }

        throw lastError;
    }

    async get<T = any>({ url, headers, params, signal }: GetParams): QueryReturnType<T> {
        const method = "GET";
        return this.config.retry
            ? this.requestWithRetry({ url, headers, params, method, signal })
            : this.request({ url, headers, params, method, signal });
    }

    async post<T = any>({ url, headers, body, params, signal }: PostParams): QueryReturnType<T> {
        const method = "POST";
        return this.config.retry
            ? this.requestWithRetry({ url, headers, body, params, method, signal })
            : this.request({ url, headers, body, params, method, signal });
    }

    async put<T = any>({ url, headers, body, params, signal }: PutParams): QueryReturnType<T> {
        const method = "PUT";
        return this.config.retry
            ? this.requestWithRetry({ url, headers, body, params, method, signal })
            : this.request({ url, headers, body, params, method, signal });
    }

    async patch<T = any>({ url, headers, body, params, signal }: PatchParams): QueryReturnType<T> {
        const method = "PATCH";
        return this.config.retry
            ? this.requestWithRetry({ url, headers, body, params, method, signal })
            : this.request({ url, headers, body, params, method, signal });
    }

    async delete<T = any>({ url, headers, body, params, signal }: DeleteParams): QueryReturnType<T> {
        const method = "DELETE";
        return this.config.retry
            ? this.requestWithRetry({ url, headers, body, method, params, signal })
            : this.request({ url, headers, body, params, method, signal });
    }
}

export default Leaf;