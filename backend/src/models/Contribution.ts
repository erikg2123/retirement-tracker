import { Schema, model } from 'mongoose';

const contributionSchema = new Schema({
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
});

const Contribution = model('Contribution', contributionSchema);

export default Contribution;