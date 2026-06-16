import { Router } from "express";
import TestController from "../controllers/test-controller.ts";


export const testRouter = Router();

testRouter.get("/test", TestController.testGET.bind(TestController));

testRouter.post("/test", TestController.testPOST.bind(TestController));

testRouter.put("/test", TestController.testPUT.bind(TestController));

testRouter.patch("/test", TestController.testPATCH.bind(TestController));

testRouter.delete("/test", TestController.testDELETE.bind(TestController));