import express, { Request, Response } from 'express';
import { Image } from '../models/image';
import { ImageStatus } from '@ndhcode/common';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

const router = express.Router();

router.put('/api/images/:id/publish', async (req: Request, res: Response) => {
  console.log('Image publish triggering');
  const image = await Image.findById(req.params.id);
  if (!image) {
    res.status(404).send(`Image with id ${req.params.id} not found`);
  } else {
    // Read the image file (assuming the image has a file path stored)
    const imagePath = path.resolve('uploads', image.filename); // Adjust this path accordingly

    // Read the image file as a Buffer
    const imageFile = fs.readFileSync(imagePath);

    // Upload to Imgur
    const imgurResponse = await axios.post(
      'https://api.imgur.com/3/image',
      {
        image: imageFile.toString('base64'), // Convert the image to base64
        type: 'base64', // Indicate that the image is in base64 format
        title: 'Simple upload', // Optional title
        description: 'This is a simple image upload in Imgur', // Optional description
      },
      {
        headers: {
          Authorization: `Client-ID 540bf5523da745f`, // Replace with your Imgur client ID
          'Content-Type': 'application/json', // Set content type to JSON
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
  }

  res.send(image);
});

export { router as publishImagesRouter };
