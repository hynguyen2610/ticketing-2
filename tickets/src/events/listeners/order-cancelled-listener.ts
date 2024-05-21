import { BadRequestError, Listener, OrderCancelledEvent, Subjects } from "@ndhcode/common";
import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queue-group-name";
import { Ticket } from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;

  queueGroupName = queueGroupName;
  async onMessage(data: OrderCancelledEvent["data"], msg: Message): Promise<void> {

    const ticket = await Ticket.findById(data.ticket.id);

    if (!ticket) {
      throw new BadRequestError("Ticket not found");
    }

    // if ticket exist, update the order id in ticket
    ticket.set({ orderId: undefined });

    await ticket.save();

    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      version: ticket.version,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      orderId: data.id,
    });

    msg.ack();
  }
}
