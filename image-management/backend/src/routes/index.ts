import express, { Request, Response } from 'express';
import { Image } from '../models/image';

const router = express.Router();

router.get('/api/images', async (req: Request, res: Response) => {
  try {
    // Extract 'published' query param
    const { published } = req.query;

    // Build query conditions
    const query: any = {};

    // If 'published' flag is present, filter for published images
    if (published !== undefined) {
      query.publishStatus = 'published';
    }

    // Fetch images from the database with the optional filter
    const images = await Image.find(query);

    // Send the response
    res.send(images);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch images' });
  }
});

export { router as indexImagesRouter };
