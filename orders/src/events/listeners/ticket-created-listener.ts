import {
  Listener,
  Subjects,
  TicketCreatedEvent,
  TracerWrapper,
} from '@ndhcode/common';
import {
  context,
  propagation
} from '@opentelemetry/api';
import { Message, Stan } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';
import { queueGroupName } from './queue-group-name';

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
  queueGroupName = queueGroupName;
  private tracerWrapper = new TracerWrapper('orders-service');

  constructor(client: Stan) {
    super(client);
  }

  async onMessage(data: TicketCreatedEvent['data'], msg: Message) {
    const { id, title, price } = data;

    const extractedParentContext = propagation.extract(
      context.active(),
      data.traceHeaders
    );

    // The empty SpanOptions still requires a place
    const span = this.tracerWrapper.getTracer().startSpan(
      'order-service:create-ticket',
      {},
      extractedParentContext
    );

    const ticket = Ticket.build({
      id,
      title,
      price,
    });
    await ticket.save();
    span.setAttributes({
      'ticket.id': ticket.id,
      'ticket.title': ticket.title,
      'ticket.price': ticket.price,
    });
    span.end();

    msg.ack();
  }
}
