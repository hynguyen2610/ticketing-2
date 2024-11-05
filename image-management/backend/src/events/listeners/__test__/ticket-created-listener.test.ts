import { TicketCreatedListener } from '../ticket-created-listener';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { natsWrapper } from '../../../nats-wrapper';
import { TicketCreatedEvent } from '@ndhcode/common';
import { Image } from '../../../models/image';

const setup = async () => {
  // Create a ticket created listener
  const listener = new TicketCreatedListener(natsWrapper.client);

  // Create a fake data event
  const data: TicketCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
    userId: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    images: ['image1.png', 'image2.png', 'image3.png'],
  };

  // Create a fake message object
  // @ts-ignore
  const message: Message = {
    ack: jest.fn(),
  };

  return { listener, data, message };
};

it('creates and saves the images belonging to the ticket', async () => {
  const { listener, data, message } = await setup();

  // Call the onMessage function with the data object + message object and await it
  await listener.onMessage(data, message);

  // Assert that the ack() method was called once
  expect(message.ack).toHaveBeenCalledTimes(1);

  const images = await Image.find({ ticketId: data.id });

  // Ensure the number of images saved matches the number of images in the event data
  expect(images).toHaveLength(data.images.length);

  // Ensure each image is saved with the correct filename and associated ticket ID
  data.images.forEach((imageFileName) => {
    const savedImage = images.find((img) => img.filename === imageFileName);
    expect(savedImage).toBeDefined(); // Ensure the image is saved
    expect(savedImage?.ticketId.toString()).toEqual(data.id); // Ensure the image is associated with the correct ticket
  });
});
