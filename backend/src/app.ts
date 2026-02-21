import express from 'express';
import cors from 'cors';
import projections from './routes/projections';
import solverRoute from './routes/solver';
import planRoute from './routes/plan';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projections', projections);
app.use('/api/solve', solverRoute);
app.use('/api/plan', planRoute);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;