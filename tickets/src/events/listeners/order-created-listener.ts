import { Listener, OrderCreatedEvent, Subjects, BadRequestError } from '@ndhcode/common';
import { queueGroupName } from './queue-group-name';
import { Message, Stan } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';

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

    console.log('changing order id to : ', data.id);

    // if ticket exist, update the order id in ticket
    ticket.set({ orderId: data.id });

    await ticket.save();

    msg.ack();
  }
}
