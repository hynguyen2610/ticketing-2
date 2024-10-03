import express, { NextFunction, Request, Response } from 'express';
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


const UPLOAD_DIR = './uploads';
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
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Price must be greater than 0'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async (err) => {
      try {
      logger.info('Received a request');

      // Use type assertion for req.files
      const { title, price } = req.body;
      logger.info("req files length: " + req.files?.length)
      
      const images = req.files ? (req.files as MulterFile[]).map((f : any) => f.filename) : [];
      // logger.info(`req body: ${req.body}`);
      logger.info(`Title is: ${title}`);
      logger.info(`Price is: ${price}`);
      logger.info(`Images length: ${images.length}`);

      (req.files as MulterFile[]).forEach((img) => {
        logger.info('Img name: ' + (img as MulterFile).filename);
        logger.info('Origin name: ' + (img as MulterFile).originalname);
      });
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

      const message = "Ticket has been created!"

      res.status(201).send({ticket, message});
    } catch(error) {
      next(error);
    }
    });
  }
);

router.get('/api/dirname', (req: Request, res: Response) => {
  res.status(200).send({ dirname: __dirname });
});

export { router as createTicketRouter };
