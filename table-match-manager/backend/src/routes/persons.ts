import express from 'express';
import { getAllPersons, createPerson } from '../controllers/personController';

const router = express.Router();

router.get('/', getAllPersons);
router.post('/', createPerson);

export default router;