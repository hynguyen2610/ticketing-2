import { Subjects, Publisher, OrderCancelledEvent } from '@ndhcode/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}
