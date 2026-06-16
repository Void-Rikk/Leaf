import Leaf from "../src";
import { expect } from "vitest";
import { LeafResponseError } from "../src/utils/utils";
import { ServerSettings, sleep } from "./utils.ts";


const baseUrl = "http://localhost:3000";
const mockData = { data: 123 };
const defaultServerSettings: ServerSettings = {
    timeout: 100,
    responseStatus: 200,
    err: 0,
};

globalThis.fetch = vi.fn(fetch);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("basic leaf", () => {

    it('should fetch the data', async () => {
        const leaf = new Leaf(baseUrl);
        const params = defaultServerSettings;

        const data = await leaf.get({ url: "/test", params });

        expect(data).toEqual(mockData);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw an error', async () => {
        const leaf = new Leaf(baseUrl);
        const params = { ...defaultServerSettings, err: 1, responseStatus: 404 };

        await expect(leaf.get({ url: "/test", params })).rejects.toThrow(LeafResponseError);
    });

    it('should stop fetching on timeout', async () => {
        const leaf = new Leaf(baseUrl, {
            timeout: 50
        });
        const params = { ...defaultServerSettings };

        await expect(leaf.get({ url: "/test", params })).rejects.toThrow("TIMEOUT");
    });

    it('should abort request with custom controller', async () => {
        const leaf = new Leaf(baseUrl);
        const params = { ...defaultServerSettings };

        const controller = new AbortController();

        const requestPromise = leaf.get({
            url: "/test",
            signal: controller.signal,
            params
        });

        controller.abort();

        await expect(requestPromise).rejects.toThrow(/abort/i);
    });
});

describe("leaf deduplication", () => {

    it('should call fetch only once and get the same result', async () => {
        const leaf = new Leaf(baseUrl);
        const params = { ...defaultServerSettings };

        const dataArr = await Promise.all([leaf.get({ url: "/test", params }), leaf.get({ url: "/test", params })]);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(dataArr).toEqual([mockData, mockData]);
    });

    it('should call fetch only once and get the same error', async () => {
        const leaf = new Leaf(baseUrl);
        const params = { ...defaultServerSettings, responseStatus: 500, err: 1 };

        const promiseArr = [leaf.get({ url: "/test", params }), leaf.get({ url: "/test", params })];

        await expect(Promise.all(promiseArr)).rejects.toThrow(LeafResponseError);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should not deduplicate POST, PUT, PATCH and DELETE', async () => {
        const leaf = new Leaf(baseUrl);
        const params = { ...defaultServerSettings, timeout: 10 };

        let expectedDataArr = [mockData, mockData, mockData];
        let dataArr: Promise<unknown>[];

        const post = () => leaf.post({ url: "/test", params });
        const put = () => leaf.put({ url: "/test", params });
        const patch = () => leaf.patch({ url: "/test", params });
        const dlt = () => leaf.delete({ url: "/test", params });

        dataArr = await Promise.all([post(), post(), post()]);
        expect(dataArr).toEqual(expectedDataArr);
        dataArr = await Promise.all([put(), put(), put()]);
        expect(dataArr).toEqual(expectedDataArr);
        dataArr = await Promise.all([patch(), patch(), patch()]);
        expect(dataArr).toEqual(expectedDataArr);
        dataArr = await Promise.all([dlt(), dlt(), dlt()]);
        expect(dataArr).toEqual(expectedDataArr);

        expect(fetch).toHaveBeenCalledTimes(12);
    });
});

describe("leaf retrying", () => {

    it('should retry request and throw last error', async () => {
        const leaf = new Leaf(baseUrl, {
            retry: 3,
            retryDelay: 100
        });
        const params = { ...defaultServerSettings, err: 1, responseStatus: 500 };

        await expect(leaf.get({ url: "/test", params })).rejects.toThrow(LeafResponseError);
        expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('should retry request on timeout', async () => {
        const leaf = new Leaf(baseUrl, {
            retry: 3,
            retryDelay: 100,
            timeout: 50,
        });
        const params = { ...defaultServerSettings };

        await expect(leaf.get({ url: "/test", params })).rejects.toThrow("TIMEOUT");
        expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('should not retry on custom abort', async () => {
        const leaf = new Leaf(baseUrl, {
            retry: 3,
            retryDelay: 100,
        });
        const params = { ...defaultServerSettings };

        const controller = new AbortController();

        const requestPromise = leaf.get({ url: "/test", params, signal: controller.signal });

        controller.abort();

        await expect(requestPromise).rejects.toThrow();
    });

    it('should not retry on non-retry status', async () => {
        const leaf = new Leaf(baseUrl, {
            retry: 3,
            retryDelay: 100,
        });
        const params = { ...defaultServerSettings, err: 1, responseStatus: 404 };

        await expect(leaf.get({ url: "/test", params })).rejects.toThrow();
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});

describe("leaf caching", () => {

    it('should get data from cache', async () => {
        const leaf = new Leaf(baseUrl, {
            cache: true,
        });
        const params = { ...defaultServerSettings };

        await expect(leaf.get({ url: "/test", params })).resolves.toEqual(mockData);
        await expect(leaf.get({ url: "/test", params })).resolves.toEqual(mockData);
        await expect(leaf.get({ url: "/test", params })).resolves.toEqual(mockData);

        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should not get data from cache when it is invalid', async () => {
        const leaf = new Leaf(baseUrl, {
            cache: true,
            cacheTime: 1
        });
        const params = { ...defaultServerSettings };

        await expect(leaf.get({ url: "/test", params })).resolves.toEqual(mockData);
        await sleep(3);
        await expect(leaf.get({ url: "/test", params })).resolves.toEqual(mockData);
        await sleep(3);
        await expect(leaf.get({ url: "/test", params })).resolves.toEqual(mockData);

        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should not get data from cache with POST, PUT, PATCH and DELETE', async () => {
        const leaf = new Leaf(baseUrl, {
            cache: true
        });
        const params = { ...defaultServerSettings };

        const post = () => leaf.post({ url: "/test", params });
        const put = () => leaf.put({ url: "/test", params });
        const patch = () => leaf.patch({ url: "/test", params });
        const dlt = () => leaf.delete({ url: "/test", params });

        await expect(post()).resolves.toEqual(mockData);
        await expect(post()).resolves.toEqual(mockData);

        await expect(put()).resolves.toEqual(mockData);
        await expect(put()).resolves.toEqual(mockData);

        await expect(patch()).resolves.toEqual(mockData);
        await expect(patch()).resolves.toEqual(mockData);

        await expect(dlt()).resolves.toEqual(mockData);
        await expect(dlt()).resolves.toEqual(mockData);

        expect(fetch).toHaveBeenCalledTimes(8);
    });
});