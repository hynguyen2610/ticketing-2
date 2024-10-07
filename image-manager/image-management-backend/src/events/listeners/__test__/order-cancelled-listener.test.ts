import { natsWrapper } from "../../../nats-wrapper";
import mongoose from "mongoose";
import { OrderCancelledEvent } from "@ndhcode/common";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../../models/ticket";
import { OrderCancelledListener } from "../order-cancelled-listener";

const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client);

  // @ts-ignore
  const message: Message = {
    ack: jest.fn(),
  };

  const orderId =  new mongoose.Types.ObjectId().toHexString();

  // Create and save the ticket
  const ticket = Ticket.build({
    title: "Canada",
    price: 20,
    userId: "someuser",
    orderId: orderId
  });

  await ticket.save();

  // The order linked to that ticket is now being cancelled
  const data: OrderCancelledEvent["data"] = {
    id: orderId,
    version: 0,
    ticket: {
      id: ticket.id,
    },
  };

  return { listener, message, ticket, data };
};

it("happy case: order is cancelled -> ticket is unreserved", async () => {
  const { listener, message, ticket, data } = await setup();

  await listener.onMessage(data, message);

  // expect the ticket has no order id now
  const reReadTicket = await Ticket.findById(ticket.id);
  expect(reReadTicket!.orderId).not.toBeDefined();

  expect(message.ack).toHaveBeenCalledTimes(1);

  // expect published ticket updated event
  expect(natsWrapper.client.publish).toHaveBeenCalledTimes(1);

});
