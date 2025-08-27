import express from 'express';
import { getQueue, addToQueue, getNextFromQueue, removeFromQueue } from '../controllers/queueController';

const router = express.Router();

router.get('/', getQueue);
router.post('/', addToQueue);
router.get('/next', getNextFromQueue);
router.delete('/:id', removeFromQueue);

export default router;