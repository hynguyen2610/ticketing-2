import {
  Listener,
  Subjects,
  BadRequestError,
  ImagePublishedEvent,
  TracerWrapper,
} from '@ndhcode/common';
import { Stan } from 'node-nats-streaming';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';
import { context, propagation, trace } from '@opentelemetry/api';

export class ImagePublishedListener extends Listener<ImagePublishedEvent> {
  subject: Subjects.ImagePublished = Subjects.ImagePublished;
  queueGroupName = 'ticket-service';

  private readonly tracerWrapper = new TracerWrapper(
    'image-management-service'
  );

  constructor(client: Stan) {
    super(client);
  }

  async onMessage(data: ImagePublishedEvent['data'], msg: Message) {
    const ticketId = data.ticketId;
    const extractedParentContext = propagation.extract(
      context.active(),
      data.traceHeaders
    );

    const span = this.tracerWrapper
      .getTracer()
      .startSpan('tickets-service:image-published-listener', {}, extractedParentContext);

    try {
      const ticket = await Ticket.findById(ticketId);

      if (!ticket) {
        throw new BadRequestError(`Ticket with id ${ticketId} not found`);
      }

      if (ticket.images) {
        const imageIndex: number | undefined = ticket.images?.findIndex(
          (image) => image === data.filename
        );
        if (imageIndex !== -1) {
          ticket.images[imageIndex] = data.publishedUrl; // Update the URL at the found index
          await ticket.save(); // Save the updated ticket
          console.log('Ticket updated with new image URL: ' + data.publishedUrl);

          const savedTicket = await Ticket.findById(ticketId);
          console.log(
            `Ticket after updated images: ${JSON.stringify(savedTicket)}`
          );

          await new TicketUpdatedPublisher(this.client).publish({
            id: ticketId,
            version: savedTicket!.version,
            title: savedTicket!.title,
            price: savedTicket!.price,
            userId: savedTicket!.userId,
            orderId: savedTicket!.orderId,
          });
        }
      } else {
        console.error(
          'Ticket received image published event but cannot find the image: ' +
            data.filename
        );
      }

      msg.ack();
    } finally {
      span.end();
    }
  }
}

