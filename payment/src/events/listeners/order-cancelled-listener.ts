import { Listener, Subjects, BadRequestError, OrderCancelledEvent } from '@ndhcode/common';
import { queueGroupName } from './queue-group-name';
import { Message, Stan } from 'node-nats-streaming';
import { Order, OrderStatus } from '../../models/order';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  constructor(client: Stan) {
    super(client);
  }

  async onMessage(data: OrderCancelledEvent["data"], msg: Message) {
    const order = await Order.findOne({ _id: data.id, version: data.version - 1 });

    if (!order) {
      throw new BadRequestError('Order not found');
    }

    order.set({ status: OrderStatus.Cancelled });
    await order.save();

    msg.ack();
  }
}
