export type ServerSettings = {
    timeout: number,
    responseStatus: number,
    err: 1 | 0,
};

export function sleep(delay: number) {
    return new Promise(res => {
        setTimeout(res, delay);
    });
}