import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { requireAuth, validateRequest } from '@ndhcode/common';
import { Ticket } from '../models/ticket';
import { TicketCreatedPublisher } from '../events/publishers/ticket-created-publisher';
import { natsWrapper } from '../nats-wrapper';
import { logger } from '@ndhcode/common/';
import multer from 'multer';
import fs from 'fs';

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    fs.mkdirSync(dir, { recursive: true }); // Ensure the uploads directory exists
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit files to 5MB (optional)
});

// File upload middleware
const uploadFiles = upload.array('files'); // Use 'files' as the field name

router.post(
  '/api/tickets',
  requireAuth,
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Price must be greater than 0'),
  ],
  validateRequest,
  uploadFiles, // Add multer middleware here
  async (req: Request, res: Response) => {
    logger.info('Received a request');

    // Use type assertion for req.files
    const uploadedFiles = req.files as Express.Multer.File[] | undefined;

    if (uploadedFiles && uploadedFiles.length > 0) {
      const fileNames = uploadedFiles.map(file => file.originalname); // Use map to get file names
      console.log(fileNames); // Logs an array of file names
    } else {
      console.log("No file uploaded");
      
    }

    const { title, price } = req.body;

    const ticket = Ticket.build({
      title,
      price,
      userId: req.currentUser!.id,
    });

    await ticket.save();

    new TicketCreatedPublisher(natsWrapper.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version,
    });

    res.status(201).send(ticket);
  }
);

router.get('/api/dirname', (req: Request, res: Response) => {
  res.status(200).send({ dirname: __dirname });
});

export { router as createTicketRouter };
