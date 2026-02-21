import express from 'express';
import { addContribution, getContributions } from '../controllers/contributionsController';

const router = express.Router();

// Route to add a new contribution
router.post('/', addContribution);

// Route to get all contributions
router.get('/', getContributions);

export default router;