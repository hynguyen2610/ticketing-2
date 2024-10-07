import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { requireAuth, validateRequest } from '@ndhcode/common';
import { Ticket } from '../models/ticket';
import { TicketCreatedPublisher } from '../events/publishers/ticket-created-publisher';
import { natsWrapper } from '../nats-wrapper';
import { logger } from '@ndhcode/common/';
import multer from 'multer';
import fs from 'fs';
import { format } from 'date-fns';
import sanitize from 'sanitize-filename';
import path from 'path';

const router = express.Router();

type MulterFile = Express.Multer.File;

const UPLOAD_DIR = '/uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, callback) => {
    const now = new Date();
    const formattedDate =
      format(now, 'yyyy-MM-dd HH:mm:ss').replace(/ /g, '_') +
      ':' +
      String(now.getMilliseconds()).padStart(3, '0');
    const sanitizedFilename = sanitize(
      `${formattedDate}${path.extname(file.originalname)}`
    );

    callback(null, sanitizedFilename);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif/; // Define allowed file types
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only images are allowed!'));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
}).array('images', 10);

router.post(
  '/api/tickets',
  requireAuth,
  upload, // Apply multer here to handle file uploads before validation
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Price must be greater than 0'),
  ],
  validateRequest, // Validate after multer processes the request
  async (req: Request, res: Response) => {
    logger.info('Req Body is: ', req.body); // Should show title and price
    logger.info('Req files are: ', req.files); // Should show uploaded files

    const { title, price } = req.body;

    const images: string[] = []; // Initialize images array

    if (req.files && Array.isArray(req.files)) {
      (req.files as MulterFile[]).forEach((img) => {
        logger.info('Img name: ' + img.filename);
        logger.info('Origin name: ' + img.originalname);
        images.push(img.filename);
      });
    }

    // Build ticket with images
    const ticket = Ticket.build({
      title,
      price,
      userId: req.currentUser!.id,
      images: images
    });

    await ticket.save();

    new TicketCreatedPublisher(natsWrapper.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version,
    });

    const message = 'Ticket has been created!';

    res.status(201).send({ ticket, message });
  }
);

router.get('/api/dirname', (req: Request, res: Response) => {
  res.status(200).send({ dirname: __dirname });
});

export { router as createTicketRouter };
