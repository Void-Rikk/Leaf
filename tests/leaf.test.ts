import Leaf from "../src";
import { expect } from "vitest";
import { LeafResponseError } from "../src/utils/utils";
import { ServerSettings } from "./utils.ts";


describe("leaf", () => {
    const baseUrl = "http://localhost:3000"
    const mockData = { data: 123 };
    const defaultServerSettings: ServerSettings = {
        timeout: 1000,
        responseStatus: 200,
        err: 0,
    };

    globalThis.fetch = vi.fn(globalThis.fetch);

    beforeEach(() => {
        vi.clearAllMocks();
    });

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

    it('should call fetch only once and get the same result', async () => {
        const leaf = new Leaf(baseUrl);
        const params = defaultServerSettings;

        const dataArr = await Promise.all([leaf.get({ url: "/test", params }), leaf.get({ url: "/test", params })]);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(dataArr).toEqual([mockData, mockData]);
    });

    it('should stop fetching on timeout', async () => {
        const leaf = new Leaf(baseUrl, {
            timeout: 500
        });
        const params = defaultServerSettings;

        await expect(leaf.get({ url: "/test", params })).rejects.toThrow();
    });
});