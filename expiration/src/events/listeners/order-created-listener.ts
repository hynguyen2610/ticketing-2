import { Listener, OrderCreatedEvent, Subjects, BadRequestError } from '@ndhcode/common';
import { Message, Stan } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  constructor(client: Stan) {
    super(client);
  }

  async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
    const ticketId = data.ticket.id;

    msg.ack();
  }
}
