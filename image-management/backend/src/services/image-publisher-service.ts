import path from 'path';
import { ImageDoc } from '../models/image';
import fs from 'fs';
import axios from 'axios';
import { ImageStatus } from '@ndhcode/common';

export class ImagePublishService {
  private static instance: ImagePublishService;

  private constructor() {}

  public static getInstance(): ImagePublishService {
    if (!ImagePublishService.instance) {
      ImagePublishService.instance = new ImagePublishService();
    }

    return ImagePublishService.instance;
  }

  async publishImage(image: ImageDoc): Promise<void> {
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

    // Set the published status and the published URL
    image.set({
      publishedStatus: ImageStatus.Published,
      publishedUrl: imgurResponse.data.data.link, // Get the link from the Imgur response
    });

    await image.save();
  }
}

