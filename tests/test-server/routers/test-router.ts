import { Router } from "express";
import TestController from "../controllers/test-controller.ts";


export const testRouter = Router();

testRouter.get("/test", TestController.test.bind(TestController));