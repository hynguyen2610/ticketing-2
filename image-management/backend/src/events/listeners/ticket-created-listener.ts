import {
  ImagePublishedEvent,
  ImageStatus,
  Listener,
  Subjects,
  TicketCreatedEvent,
  TracerWrapper
} from '@ndhcode/common';
import {
  context,
  propagation
} from '@opentelemetry/api';
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
  private tracerWrapper = new TracerWrapper('image-management-service');

  constructor(client: Stan) {
    super(client);
  }

  async onMessage(data: TicketCreatedEvent['data'], msg: Message) {
    const { images, id, traceHeaders } = data;

    const extractedParentContext = propagation.extract(
      context.active(),
      traceHeaders
    );

    const span = this.tracerWrapper.getTracer().startSpan(
      'image-management:process-images',
      {},
      extractedParentContext
    );

    try {
      if (images) {
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
            traceHeaders: traceHeaders
          } as ImagePublishedEvent['data']);
        });

        await Promise.all(savePromises);
      }
    } finally {
      span.end();
    }

    msg.ack();
  }
}

