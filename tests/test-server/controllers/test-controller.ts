import express from "express";


class TestController {

    async test(req: express.Request, res: express.Response) {
        const { timeout, responseStatus, err } = req.query;

        console.log(timeout, responseStatus, err);

        await this.#sleep(Number(timeout));

        if (Number(err)) {
            return res.status(Number(responseStatus)).json({ error: "Error" });
        }

        return res.status(Number(responseStatus)).json({ data: 123 });
    }

    async #sleep(delay: number) {
        return new Promise((res) => {
            setTimeout(res, delay);
        });
    }
}

export default new TestController();