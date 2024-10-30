import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import cookieSession from 'cookie-session';
import { errorHandler, NotFoundError, currentUser } from '@ndhcode/common';
import { indexImagesRouter } from './routes';
import cors from 'cors';
import { publishImagesRouter } from './routes/publish';


const app = express();

app.use(cors());

app.set('trust proxy', true);
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: false,
  })
);
app.use(currentUser);

app.use(indexImagesRouter);
app.use(publishImagesRouter);

app.all('*', async (req, res) => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
