import { Order, OrderStatus } from "../../../models/order";
import { Message } from "node-nats-streaming";
import { OrderCreatedListener } from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { OrderCreatedEvent } from "@ndhcode/common";
import mongoose from "mongoose";

const setup = async () => {
  const data: OrderCreatedEvent["data"] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    expiresAt: "123",
    userId: "123",
    status: OrderStatus.Created,
    ticket: {
      id: "123",
      price: 10,
    },
  };

  // @ts-ignore
  const message: Message = {
    ack: jest.fn(),
  };

  return { data, message };
};

it("order replica in payment is created when receiving order created event", async () => {
  const { data, message } = await setup();

  const listener = new OrderCreatedListener(natsWrapper.client);

  await listener.onMessage(data, message);

  // const order = await Order.findOne({ id: data.id });
  const order = await Order.findById(data.id);

  // Print all orders
  console.log("Orders: ", order);


  expect(order!.price).toEqual(data.ticket.price);
});

it("ack the message", async () => {
  const { data, message } = await setup();

  const listener = new OrderCreatedListener(natsWrapper.client);

  await listener.onMessage(data, message);

  expect(message.ack).toHaveBeenCalled();
});
