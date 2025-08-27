import express from 'express';
import { getRankings, getEloRankings } from '../controllers/rankingsController';

const router = express.Router();

router.get('/', getRankings);
router.get('/elo', getEloRankings);

export default router;