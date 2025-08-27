import express from 'express';
import { getPlayerStats } from '../controllers/playerStatsController';

const router = express.Router();

router.get('/:playerId', getPlayerStats);

export default router;