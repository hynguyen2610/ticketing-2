import {
  Listener,
  OrderCreatedEvent,
  Subjects,
  BadRequestError,
} from "@ndhcode/common";
import { Message, Stan } from "node-nats-streaming";
import { queueGroupName } from "./queue-group-name";
import { expirationQueue } from "../../queues/expiration-queue";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  constructor(client: Stan) {
    super(client);
  }

  async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
    const ticketId = data.ticket.id;

    // const delay = new Date(data.expiresAt).getTime() - new Date().getTime();
    const delay = 100000;
    await expirationQueue.add({ orderId: data.id }, { delay: delay });

    msg.ack();
  }
}
