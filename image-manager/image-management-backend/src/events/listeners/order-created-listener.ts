import { Listener, OrderCreatedEvent, Subjects, BadRequestError } from '@ndhcode/common';
import { queueGroupName } from './queue-group-name';
import { Message, Stan } from 'node-nats-streaming';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

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
