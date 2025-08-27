import express from 'express';
import { getCurrentMatch, startMatch, endMatch, cancelMatch, forfeitMatch, startMatchFromQueue } from '../controllers/matchController';

const router = express.Router();

router.get('/current', getCurrentMatch);
router.post('/start', startMatch);
router.post('/start-from-queue', startMatchFromQueue);
router.post('/end', endMatch);
router.post('/cancel', cancelMatch);
router.post('/forfeit', forfeitMatch);

export default router;