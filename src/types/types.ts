export type ParamValue = string | number;
export type QueryParams = Record<string, ParamValue>
export type Body = any;

type GenericParams = {
    url: string;
    headers?: HeadersInit;
    params?: QueryParams;
    signal?: AbortSignal;
};

export type QueryReturnType<T> = Promise<T>;

export type CacheEntry = {
    data: any,
    time: number,
};

export type RequestParams = {
    method?: string,
    body?: Body,
} & GenericParams;

export type GetParams = GenericParams;

export type PostParams = {
    body?: Body,
} & GenericParams;

export type DeleteParams = {
    body?: Body,
} & GenericParams;

export type PutParams = {
    body?: Body,
} & GenericParams;

export type PatchParams = {
    body?: Body,
} & GenericParams;

export type LeafConfig = {
    timeout?: number,
    headers?: HeadersInit,
    retry?: number,
    retryDelay?: number
    cache?: boolean
    cacheTime?: number,
};
export interface ILeaf {
    get: <T = unknown,>({ url, headers, params }: GetParams) => QueryReturnType<T>;
    post: <T = unknown,>({ url, headers, body, params }: PostParams) => QueryReturnType<T>;
    delete: <T = unknown,>({ url, headers, body, params }: DeleteParams) => QueryReturnType<T>;
    put: <T = unknown,>({ url, headers, body, params }: PutParams) => QueryReturnType<T>;
    patch: <T = unknown,>({ url, headers, body, params }: PatchParams) => QueryReturnType<T>;
}