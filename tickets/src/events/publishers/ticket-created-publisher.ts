import { Publisher, Subjects, TicketCreatedEvent } from '@ndhcode/common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}
