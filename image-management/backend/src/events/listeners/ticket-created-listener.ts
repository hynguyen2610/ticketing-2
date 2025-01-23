import {
  ImagePublishedEvent,
  ImageStatus,
  Listener,
  Subjects,
  TicketCreatedEvent
} from '@ndhcode/common';
import { Message, Stan } from 'node-nats-streaming';
import { Image } from '../../models/image';
import { ImagePublishService } from '../../services/image-publisher-service';
import { ImagePublishedPublisher } from '../publishers/image-published-publisher';
import { queueGroupName } from './queue-group-name';

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
  queueGroupName = queueGroupName;

  private publishService = ImagePublishService.getInstance();
  private eventPublisher = new ImagePublishedPublisher(this.client);

  constructor(client: Stan) {
    super(client);
  }

  async onMessage(data: TicketCreatedEvent['data'], msg: Message) {
    const { images, id } = data;
    console.log('Image management received ticket created');

    if (images) {
      console.log('Image management started saving');
      const savePromises = images.map(async (filename) => {
        const image = Image.build({
          filename: filename,
          publishedStatus: ImageStatus.Created,
          publishedUrl: undefined,
          ticketId: id,
        });

        await image.save();
        await this.publishService.publishImage(image);
        const publishedImage = await Image.findById(image.id);

        this.eventPublisher.publish({
          id: publishedImage!.id,
          filename: publishedImage!.filename,
          publishedStatus: publishedImage!.publishedStatus,
          publishedUrl: publishedImage?.publishedUrl!,
          ticketId: publishedImage!.ticketId,
          version: publishedImage!.version,
        } as ImagePublishedEvent['data']);
      });

      await Promise.all(savePromises);
      console.log('Image management finished saving');
    }

    msg.ack();
  }
}
