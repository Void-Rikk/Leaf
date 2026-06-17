export type ServerSettings = {
    timeout: number,
    responseStatus: number,
    err: 1 | 0,
    returnType: "json" | "text" | "blob"
};

export function sleep(delay: number) {
    return new Promise(res => {
        setTimeout(res, delay);
    });
}