import {
  Listener,
  Subjects,
  BadRequestError,
  ImagePublishedEvent,
} from '@ndhcode/common';
import { queueGroupName } from './queue-group-name';
import { Message, Stan } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class ImagePublishedListener extends Listener<ImagePublishedEvent> {
  subject: Subjects.ImagePublished = Subjects.ImagePublished;
  queueGroupName = queueGroupName;

  constructor(client: Stan) {
    super(client);
  }

  async onMessage(data: ImagePublishedEvent['data'], msg: Message) {
    const ticketId = data.ticketId;

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
  }
}
