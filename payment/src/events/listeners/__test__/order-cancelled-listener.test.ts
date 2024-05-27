import { Order, OrderStatus } from "../../../models/order";
import { Message } from "node-nats-streaming";
import { natsWrapper } from "../../../nats-wrapper";
import mongoose from "mongoose";
import { OrderCancelledEvent } from '@ndhcode/common';
import { OrderCancelledListener } from "../order-cancelled-listener";

const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client);

  const orderId = new mongoose.Types.ObjectId().toHexString();

  const order = Order.build({
    id: orderId,
    status: OrderStatus.Created,
    version: 0,
    userId: "heroone",
    price: 100,
  });

  await order.save();

  console.log("Current version of order:", order.version);

  const message: Message = {
    ack: jest.fn(),
  } as unknown as Message;


  const data: OrderCancelledEvent["data"] = {
    id: orderId,
    version: 1,
    ticket: {
      id: ""
    }
  };

  return { listener, message, data };
};

it("order replica is cancelled after received order cancelled event", async () => {
  const { listener, message, data } = await setup();

  await listener.onMessage(data, message);

  const updatedOrder = await Order.findById(data.id);

  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});
