import { Publisher, Subjects, TicketUpdatedEvent } from '@ndhcode/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
}
