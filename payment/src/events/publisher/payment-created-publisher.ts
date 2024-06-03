import { PaymentCreatedEvent, Publisher, Subjects } from "@ndhcode/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}
