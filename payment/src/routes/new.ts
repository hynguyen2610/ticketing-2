import { requireAuth, validateRequest } from "@ndhcode/common";
import { body } from "express-validator";
import express, { Request, Response } from "express";

const router = express.Router();

router.post(
  "/api/payment",
  requireAuth,
  [
    body("token").not().isEmpty().withMessage("Token is required"),
    body("orderId").not().isEmpty().withMessage("Order Id is required"),
  ],
  validateRequest,
  (req: Request, res: Response) => {
    res.send({ success: true });
  }
);

export { router as newPaymentRouter };
