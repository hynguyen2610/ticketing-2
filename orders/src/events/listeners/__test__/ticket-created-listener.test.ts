import { TicketCreatedListener } from "../ticket-created-listener";
import mongoose from "mongoose";
import { Ticket } from "../../../models/ticket";
import { Message } from "node-nats-streaming";
import { natsWrapper } from "../../../nats-wrapper";
import { TicketCreatedEvent } from '@ndhcode/common';

const setup = async () => {
  // Create a ticket created listener
  const listener = new TicketCreatedListener(natsWrapper.client);

  // Create a fake data event
  const data: TicketCreatedEvent["data"] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    title: "concert",
    price: 20,
    userId: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
  };

  // Create a fake message object
  const message: Message = {
    ack: jest.fn(),
    getSubject: function (): string {
      throw new Error("Function not implemented.");
    },
    getSequence: function (): number {
      throw new Error("Function not implemented.");
    },
    getRawData: function (): Buffer {
      throw new Error("Function not implemented.");
    },
    getData: function (): String | Buffer {
      throw new Error("Function not implemented.");
    },
    getTimestampRaw: function (): number {
      throw new Error("Function not implemented.");
    },
    getTimestamp: function (): Date {
      throw new Error("Function not implemented.");
    },
    isRedelivered: function (): boolean {
      throw new Error("Function not implemented.");
    },
    getCrc32: function (): number {
      throw new Error("Function not implemented.");
    }
  };

  return { listener, data, message };
};

it("create and save a ticket", async () => {
  const { listener, data, message } = await setup();

  // Call the onMessage function with the data object + message object
  listener.onMessage(data, message);

  // Assertion if the ticket is created
  const ticket = await Ticket.findById(data.id);

  expect(ticket).toBeDefined();
  expect(ticket!.title).toEqual(data.title);
  expect(ticket!.price).toEqual(data.price);

  // expect the ack() method called by 1
  expect(message.ack).toHaveBeenCalledTimes(1);
});