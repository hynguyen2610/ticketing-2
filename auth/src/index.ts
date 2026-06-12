import mongoose from 'mongoose';

import { app } from './app';
import { User } from './models/user';

const createDefaultAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@test.com';
  const password = process.env.ADMIN_PASSWORD || 'password';

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log(`Default admin already exists: ${email}`);
    return;
  }

  const admin = User.build({ email, password });
  await admin.save();
  console.log(`Created default admin user: ${email}`);
};

const start = async () => {
  console.log('Starting up...!!!');

  if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY must be defined');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined');
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDb');
    await createDefaultAdmin();
  } catch (err) {
    console.error(err);
  }

  app.listen(3000, () => {
    console.log('Listening on port 3000!!');
  });
};

start();
