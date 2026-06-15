import { QueryParams } from "../types/types";

export class LeafResponseError extends Error {
    public status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export function getResponseData<T = any>(response: Response): Promise<T> {
    if (!response.ok) {
        throw new LeafResponseError(`Error: ${response.status} ${response.statusText}`, response.status)
    }

    if (response.status === 204) return Promise.resolve(null) as Promise<T>;

    const contentType = response.headers.get("content-type");

    if (contentType?.includes("json")) {
        return response.json();
    }
    else if (contentType?.includes("text")) {
        return response.text() as Promise<T>;
    }

    return response.blob() as Promise<T>;
}

export function constructQueryParams(params?: QueryParams): string {

    let queryParams = "";
    if (params) {
        queryParams += "?";
        const entries = Object.entries(params);
        entries.forEach(([param, value], ind) => {
            queryParams += `${encodeURIComponent(param)}=${encodeURIComponent(value)}`;
            if (ind !== entries.length - 1) {
                queryParams += "&";
            }
        });
    }

    return queryParams;
}

export function sleep(delay: number) {
    return new Promise((res) => {
        setTimeout(res, delay);
    });
}

export function mergeSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    signals.forEach(signal => {
        if (!signal) return;

        if (signal.aborted) {
            controller.abort(signal.reason);
        }

        signal.addEventListener("abort", () => {
            controller.abort(signal.reason);
        }, { once: true });
    });

    return controller.signal;
}

export function shouldRetry(err: Error, signal?: AbortSignal): boolean {
    const noRetryStatuses = new Set([400, 401, 403, 404]);

    if (err instanceof LeafResponseError) {
        const status = err.status;
        if (noRetryStatuses.has(status)) {
            return false;
        }
    }
    if (err.name === "AbortError") {
        return !signal?.aborted;
    }

    return true;
}