import { ImagePublishedEvent, Publisher, Subjects } from '@ndhcode/common';

export class ImagePublishedPublisher extends Publisher<ImagePublishedEvent> {
  readonly subject = Subjects.ImagePublished;
}
