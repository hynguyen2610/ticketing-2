import { BadRequestError, NotAuthorizedError, OrderStatus, requireAuth, validateRequest } from "@ndhcode/common";
import { body } from "express-validator";
import express, { Request, Response } from "express";
import { Order } from "../models/order";

const router = express.Router();

router.post(
  "/api/payment",
  requireAuth,
  [
    body("token").not().isEmpty().withMessage("Token is required"),
    body("orderId").not().isEmpty().withMessage("Order Id is required"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { token, orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new BadRequestError("Order not found");
    }

    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    if (order.status == OrderStatus.Cancelled) {
      throw new BadRequestError("Cannot pay for a cancelled order");
    }

    if (order.status == OrderStatus.Complete) {
      throw new BadRequestError("Cannot pay for an order that has already been paid for");
    }

    res.send({ success: true });
  }
);

export { router as newPaymentRouter };
