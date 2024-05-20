import mongoose from "mongoose";
import { Ticket } from "../../../models/ticket";
import { Message } from "node-nats-streaming";
import { natsWrapper } from "../../../nats-wrapper";
import { TicketUpdatedEvent } from "@ndhcode/common";
import { TicketUpdatedListener } from "../ticket-updated-listener";

const setup = async () => {
  // Create a ticket created listener
  const listener = new TicketUpdatedListener(natsWrapper.client);

  const ticketId = new mongoose.Types.ObjectId().toHexString();

  const ticket = Ticket.build({
    id: ticketId,
    title: "Canada",
    price: 20,
  });

  await ticket.save();

  // Create a fake data event
  const data: TicketUpdatedEvent["data"] = {
    id: ticketId,
    title: "America",
    price: 30,
    userId: "someuser",
    version: 1,
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
    },
  };

  return { listener, data, message };
};

it("create and save a ticket", async () => {
  const { listener, data, message } = await setup();

  // Call the onMessage function with the data object + message object
  await listener.onMessage(data, message);

  // Re-read the ticket from database and check if its data is updated
  const ticket = await Ticket.findById(data.id);

  expect(ticket).toBeDefined();
  expect(ticket!.title).toEqual(data.title);
  expect(ticket!.price).toEqual(data.price);
  expect(ticket!.version).toEqual(data.version);

  // expect the ack() method called by 1
  expect(message.ack).toHaveBeenCalledTimes(1);
});

it("error if the pair of ticket id is not exist", async () => {
  const { listener, data, message } = await setup();

  data.id = new mongoose.Types.ObjectId().toHexString();

  // Call the onMessage function with the data object + message object
  // expect error that ticket is not found
  let errMessage = "";
  try {
    await listener.onMessage(data, message);
  } catch (err) {
    expect(err instanceof Error).toBeTruthy();
    errMessage = (err as Error).message;
  }
  expect(errMessage).toEqual("Ticket not found");
});

it("error if previous version of ticket is not exist", async () => {
  const { listener, data, message } = await setup();

  const oldTicket = await Ticket.findById(data.id);

  data.version = 2;

  // Call the onMessage function with the data object + message object
  // expect error that ticket is not found
  let errMessage = "";
  try {
    await listener.onMessage(data, message);
  } catch (err) {
    expect(err instanceof Error).toBeTruthy();
    errMessage = (err as Error).message;
  }
  expect(errMessage).toEqual("Ticket not found");
  expect(message.ack).not.toHaveBeenCalled();

  const ticketAfterEvent = await Ticket.findById(data.id);
  expect(ticketAfterEvent?.title).toEqual(oldTicket?.title);
  expect(ticketAfterEvent?.price).toEqual(oldTicket?.price);
});
