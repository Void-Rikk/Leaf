import express from 'express';
import dotenv from 'dotenv';
import { testRouter } from "./routers/test-router.ts";

dotenv.config();

const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use(testRouter);

function startApp() {
    app.listen(PORT, () => {
        console.log(`SERVER STARTED AT ${PORT}`);
    });
}

startApp();