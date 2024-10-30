import { TicketCreatedListener } from "../ticket-created-listener";
import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { natsWrapper } from "../../../nats-wrapper";
import { TicketCreatedEvent } from '@ndhcode/common';
import { Image } from '../../../models/image';
Image

const setup = async () => {
  // Create a ticket created listener
  const listener = new TicketCreatedListener(natsWrapper.client);

  // Create a fake data event
  const data: TicketCreatedEvent["data"] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    title: "concert",
    price: 20,
    userId: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    images: ["image1.png", "image2.png", "image3.png"],
  };

  // Create a fake message object
  // @ts-ignore
  const message: Message = {
    ack: jest.fn(),
  };

  return { listener, data, message };
};

it("create and save the images belong to the ticket", async () => {
  const { listener, data, message } = await setup();

  // Call the onMessage function with the data object + message object
  listener.onMessage(data, message);

  // Assertion if the ticket is created
  const images = await Image.findById(data.id);

  // expect the ack() method called by 1
  expect(message.ack).toHaveBeenCalledTimes(1);

  // Add assertions to check if all images are saved
  if (data.images) {
  expect(images).toHaveLength(data.images.length); // Assuming `data.images` contains the images you expect to be saved

  // Optionally, you can check the details of the saved images
  data.images.forEach((image) => {
    const savedImage = Image.find((img: { filename: string; published_url: string }) => img.filename === image);
    expect(savedImage).toBeDefined(); // Ensure the image is saved
  });
}
});