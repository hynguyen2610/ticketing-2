import express, { Request, Response } from 'express';
import { Image } from '../models/image';
import { ImageStatus } from '@ndhcode/common';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { ImagePublishedPublisher } from '../events/publishers/image-published-publisher';
import { natsWrapper } from '../nats-wrapper';
import { ImagePublishService } from '../services/image-publisher-service';

const router = express.Router();

router.put('/api/images/:id/publish', async (req: Request, res: Response) => {
  const image = await Image.findById(req.params.id);
  if (!image) {
    res.status(404).send(`Image with id ${req.params.id} not found`);
  } else {
    // Read the image file as a Buffer
    const publisher = ImagePublishService.getInstance();

    await publisher.publishImage(image);

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
