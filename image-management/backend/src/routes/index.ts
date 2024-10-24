import express, { Request, Response } from 'express';
import { requireAuth } from '@ndhcode/common';
import { Image } from '../models/image';

const router = express.Router();

router.get('/api/images', async (req: Request, res: Response) => {
  const images = await Image.find({});

  res.send(images);
});

export { router as indexImagesRouter };
