import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedDatabase } from './seed.js';
import teamsRouter from './routes/teams.js';
import playersRouter from './routes/players.js';
import picksRouter from './routes/picks.js';
import draftRouter from './routes/draft.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Seed database on startup
seedDatabase();

// API routes
app.use('/api/teams', teamsRouter);
app.use('/api/players', playersRouter);
app.use('/api/picks', picksRouter);
app.use('/api/draft', draftRouter);

// Serve React frontend in production
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// SPA catch-all — serve index.html for any non-API route
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
