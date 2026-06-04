import {
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

    constructor(baseUrl?: string, config?: LeafConfig) {
        this.baseUrl = baseUrl ? baseUrl : "";
        this.config = {
            retry: 0,
            retryDelay: 0,
            ...config
        };
    }

    private createTimeoutSignal(timeout: number) {
        const controller = new AbortController();
        setTimeout(() => controller.abort("TIMEOUT"), timeout);
        return controller.signal;
    }

    private async request<T>({ url, method="GET", headers, body, params, signal }: RequestParams): QueryReturnType<T> {
        const queryParams = constructQueryParams(params);
        let timeoutSignal;
        let combinedSignal;

        if (this.config.timeout) {
            timeoutSignal = this.createTimeoutSignal(this.config.timeout);
        }

        if (timeoutSignal && signal) {
            combinedSignal = mergeSignals([timeoutSignal, signal]);
        }

        return fetch(this.baseUrl + url + queryParams, {
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
                if (!shouldRetry(e, signal)) {
                    throw lastError;
                }
                await sleep((this.config.retryDelay! * 2**i) + Math.random() * 10);
            }
        }

        throw lastError;
    }

    async get<T = any>({ url, headers, params, signal }: GetParams): QueryReturnType<T> {
        const method = "GET";
        if (this.config.retry) {
            return this.requestWithRetry({ url, headers, params, method, signal });
        }
        return this.request({ url, headers, params, method, signal });
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