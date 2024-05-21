import { Listener, OrderCreatedEvent, Subjects, BadRequestError } from '@ndhcode/common';
import { queueGroupName } from './queue-group-name';
import { Message, Stan } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  constructor(client: Stan) {
    super(client);
  }

  async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
    const ticketId = data.ticket.id;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      throw new BadRequestError('Ticket not found');
    }

    // if ticket exist, update the order id in ticket
    ticket.set({ orderId: data.id });

    await ticket.save();

    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      version: ticket.version,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      orderId: data.id
    });

    msg.ack();
  }
}
