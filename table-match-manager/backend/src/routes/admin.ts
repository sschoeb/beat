import express from 'express';
import { getAllMatches, deleteMatch } from '../controllers/adminController';

const router = express.Router();

// Simple authentication middleware
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const password = req.headers['x-admin-password'] as string;
  
  if (password !== 'tfcz3000') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  next();
};

router.get('/matches', authenticate, getAllMatches);
router.delete('/matches/:id', authenticate, deleteMatch);

export default router;