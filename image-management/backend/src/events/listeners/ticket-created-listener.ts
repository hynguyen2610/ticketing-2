import { Message, Stan } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import {
  TicketCreatedEvent,
  Listener,
  Subjects,
  ImageStatus,
  logger,
} from '@ndhcode/common';
import { Image } from '../../models/image';

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
  queueGroupName = queueGroupName;

  constructor(client: Stan) {
    super(client);
  }

  async onMessage(data: TicketCreatedEvent['data'], msg: Message) {
    const { images, id } = data;
    console.log("Image management received ticket created");

    if (images) {
      console.log("Image management started saving");
      const savePromises = images.map(async (filename) => {
        const image = Image.build({
          filename: filename,
          published_status: ImageStatus.Created,
          published_url: undefined,
          ticketId: id,
        });

        await image.save();
      });

      await Promise.all(savePromises);
      console.log("Image management finished saving");
    }

    msg.ack();
  }
}
