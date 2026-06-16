import express from "express";


class TestController {

    private async test(req: express.Request, res: express.Response) {
        const { timeout, responseStatus, err } = req.query;

        await this.#sleep(Number(timeout));

        if (Number(err)) {
            return res.status(Number(responseStatus)).json({ error: "Error" });
        }

        return res.status(Number(responseStatus)).json({ data: 123 });
    }

    async testGET(req: express.Request, res: express.Response) {
        return this.test(req, res);
    }

    async testPOST(req: express.Request, res: express.Response) {
        return this.test(req, res);
    }

    async testPUT(req: express.Request, res: express.Response) {
        return this.test(req, res);
    }

    async testPATCH(req: express.Request, res: express.Response) {
        return this.test(req, res);
    }

    async testDELETE(req: express.Request, res: express.Response) {
        return this.test(req, res);
    }

    async #sleep(delay: number) {
        return new Promise((res) => {
            setTimeout(res, delay);
        });
    }
}

export default new TestController();