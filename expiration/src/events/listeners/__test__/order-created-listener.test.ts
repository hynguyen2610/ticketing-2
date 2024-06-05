import { OrderCreatedListener } from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { OrderCreatedEvent } from "../../../../../common/build/events/order-created-event";
import { OrderStatus } from "@ndhcode/common";
import { Message } from "node-nats-streaming";
import { expirationQueue } from "../../../queues/expiration-queue";

// Mock the expirationQueue
jest.mock("../../../queues/expiration-queue");

it("adds an object to the expiration queue", async () => {
  // Create a mock Message object
  // @ts-ignore
  const message: Message = {
    ack: jest.fn(), // Mock the ack method
  };

  // Create an instance of the listener
  const listener = new OrderCreatedListener(natsWrapper.client);

  jest.useFakeTimers();

  // Define some test data for the event
  const eventData: OrderCreatedEvent["data"] = {
    id: "orderId123",
    ticket: {
      id: "ticketId123",
      price: 0,
    },
    version: 0,
    status: OrderStatus.Created,
    userId: "someone",
    expiresAt: new Date(new Date().getTime() + 4000).toDateString(), // Using relative time for delay
  };

  // Call the onMessage method with the test data and mock message
  await listener.onMessage(eventData, message);

  // Assert that the expirationQueue.add method was called once
  expect(expirationQueue.add).toHaveBeenCalledTimes(1);

  // Assert that the message ack method was called
  expect(message.ack).toHaveBeenCalledTimes(1);
});
