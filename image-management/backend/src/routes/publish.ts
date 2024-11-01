import express, { Request, Response } from 'express';
import { Image } from '../models/image';
import { ImageStatus } from '@ndhcode/common';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { ImagePublishedPublisher } from '../events/publishers/image-published-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.put('/api/images/:id/publish', async (req: Request, res: Response) => {
  console.log('Image publish triggering');
  const image = await Image.findById(req.params.id);
  if (!image) {
    res.status(404).send(`Image with id ${req.params.id} not found`);
  } else {
    const imagePath = path.resolve('uploads', image.filename);

    // Read the image file as a Buffer
    const imageFile = fs.readFileSync(imagePath);

    // Upload to Imgur
    const imgurResponse = await axios.post(
      'https://api.imgur.com/3/image',
      {
        image: imageFile.toString('base64'),
        type: 'base64',
        title: 'Simple upload',
        description: 'This is a simple image upload in Imgur',
      },
      {
        headers: {
          Authorization: `Client-ID 540bf5523da745f`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Image publish finished');

    // Set the published status and the published URL
    image.set({
      publishedStatus: ImageStatus.Published,
      publishedUrl: imgurResponse.data.data.link, // Get the link from the Imgur response
    });

    await image.save();

    new ImagePublishedPublisher(natsWrapper.client).publish({
      id: image.id,
      version: image.version,
      ticketId: image.ticketId,
      publishedStatus: image.publishedStatus,
      publishedUrl: image.publishedUrl!,
      filename: image.filename
    });
  }

  res.send(image);
});

export { router as publishImagesRouter };
