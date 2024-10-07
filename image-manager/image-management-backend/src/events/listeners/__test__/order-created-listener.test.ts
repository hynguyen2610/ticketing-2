import { OrderCreatedListener } from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { OrderCreatedEvent } from '../../../../../common/build/events/order-created-event';
import mongoose from 'mongoose';
import { OrderStatus } from '@ndhcode/common';
import { Message } from 'node-nats-streaming';
import { Ticket } from "../../../models/ticket";

const setup = async () => {
    const listener = new OrderCreatedListener(natsWrapper.client);

    const message: Message = {
        ack: jest.fn(),

        // Added these dummy impl just to get rid of the build error
        getSubject: function (): string {
            throw new Error("Function not implemented.");
        },
        getSequence: function (): number {
            throw new Error("Function not implemented.");
        },
        getRawData: function () {
            throw new Error("Function not implemented.");
        },
        getData: function () {
            throw new Error("Function not implemented.");
        },
        getTimestampRaw: function (): number {
            throw new Error("Function not implemented.");
        },
        getTimestamp: function (): Date {
            throw new Error("Function not implemented.");
        },
        isRedelivered: function (): boolean {
            throw new Error("Function not implemented.");
        },
        getCrc32: function (): number {
            throw new Error("Function not implemented.");
        }
    }

    // Create and save the ticket
    const ticket = Ticket.build({
        title: 'Canada',
        price: 20,
        userId: 'someuser'
    });

    await ticket.save();

    const data : OrderCreatedEvent['data'] = {
        id: new mongoose.Types.ObjectId().toHexString(),
        version: 0,
        status: OrderStatus.Created,
        userId: "someuser",
        expiresAt: new Date().toDateString(),
        ticket: {
            id: ticket.id,
            price: 20
        }
    }

    return { listener, message, ticket, data };
}

it('happy case: order created -> ticket is reserved', async () => {
    const { listener, message, ticket, data } = await setup();

    // Call the onMessage and see
    await listener.onMessage(data, message);

    // expect the ticket has order id now
    const reReadTicket = await Ticket.findById(ticket.id);
    expect(reReadTicket!.orderId).toEqual(data.id);

    expect(message.ack).toHaveBeenCalledTimes(1);

    // expect published ticket updated event
    expect(natsWrapper.client.publish).toHaveBeenCalledTimes(1);
    
    const tickedUpdatedData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);

    expect(ticket.id).toEqual(tickedUpdatedData.id);
});

