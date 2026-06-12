import express from 'express';
import { currentUser } from '@ndhcode/common';

const router = express.Router();

router.get('/api/users/currentuser', currentUser, (req, res) => {
  const auth0Profile = (req.session as any)?.auth0User || null;
  res.send({ currentUser: req.currentUser || auth0Profile });
});

export { router as currentUserRouter };
