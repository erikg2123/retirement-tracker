import { Request, Response } from 'express';
import Contribution from '../models/Contribution';

// Function to add a new contribution
export const addContribution = async (req: Request, res: Response) => {
    try {
        const { amount, date } = req.body;
        const newContribution = new Contribution({ amount, date });
        await newContribution.save();
        res.status(201).json(newContribution);
    } catch (error) {
        res.status(500).json({ message: 'Error adding contribution', error });
    }
};

// Function to get all contributions
export const getContributions = async (req: Request, res: Response) => {
    try {
        const contributions = await Contribution.find();
        res.status(200).json(contributions);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving contributions', error });
    }
};