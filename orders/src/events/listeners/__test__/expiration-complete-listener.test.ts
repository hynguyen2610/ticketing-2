import mongoose from "mongoose";
import { Ticket } from "../../../models/ticket";
import { Message } from "node-nats-streaming";
import { natsWrapper } from "../../../nats-wrapper";
import { ExpirationCompleteEvent, OrderStatus } from "@ndhcode/common";
import { ExpirationCompleteListener } from "../expiration-complete-listener";
import { Order } from "../../../models/order";

const setup = async () => {
  // Create a ticket and save it
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: "concert",
    price: 20,
  });
  await ticket.save();

  // Create an order and save it
  const orderId = new mongoose.Types.ObjectId().toHexString();

  const order = Order.build({
    userId: "someuser",
    status: OrderStatus.Created,
    expiresAt: new Date(),
    ticket: ticket,
  });
  await order.save();

  // Create a fake nats client
  natsWrapper.client.publish = jest
    .fn()
    .mockImplementation(
      (subject: string, data: string, callback: () => void) => {
        callback();
      }
    );

  //created listener
  const listener = new ExpirationCompleteListener(natsWrapper.client);

  // Create a fake data event
  const data: ExpirationCompleteEvent["data"] = {
    orderId: order.id,
  };

  // Create a fake message object
  // @ts-ignore
  const message: Message = {
    ack: jest.fn(),
  };

  return { listener, data, message };
};

it("order is cancelled and order cancelled event is published", async () => {
  const { listener, data, message } = await setup();

  // Call the onMessage function with the data object + message object
  await listener.onMessage(data, message);

  // Assertion if the order is cancelled
  const order = await Order.findById(data.orderId);

  expect(order?.status).toEqual(OrderStatus.Cancelled);

  // expect the ack() method called by 1
  expect(message.ack).toHaveBeenCalledTimes(1);

  // expect the OrderCancelledPublisher publish() has been called once with correct data
  const orderCancelledData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );

  expect(order?.id).toEqual(orderCancelledData.id);
});
