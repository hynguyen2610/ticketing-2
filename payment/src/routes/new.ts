import {
  BadRequestError,
  NotAuthorizedError,
  OrderStatus,
  requireAuth,
  validateRequest,
} from "@ndhcode/common";
import { body } from "express-validator";
import express, { Request, Response } from "express";
import { Order } from "../models/order";
import { stripeObject } from "../stripe";
import { Payment } from "../models/payment";
import { PaymentCreatedPublisher } from "../events/publisher/payment-created-publisher";
import { natsWrapper } from "../nats-wrapper";

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
      throw new BadRequestError(
        "Cannot pay for an order that has already been paid for"
      );
    }

    const charge = await stripeObject.charges.create({
      currency: "usd",
      amount: order.price * 100,
      source: token,
    });

    const payment = Payment.build({
      orderId,
      stripeId: charge.id,
    });
    await payment.save();

    new PaymentCreatedPublisher(natsWrapper.client).publish({
      id: payment.id,
      orderId: order.id,
      stripeId: charge.id,
    });

    res.status(201).send({ id: payment.id });
  }
);

export { router as newPaymentRouter };
