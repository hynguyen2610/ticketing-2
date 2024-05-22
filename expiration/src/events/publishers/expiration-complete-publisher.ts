import { ExpirationCompleteEvent, Publisher, Subjects } from "@ndhcode/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;

  
}