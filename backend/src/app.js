import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import locationRoutes from './routes/locationRoutes.js';
import crowdRoutes from './routes/crowdRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { getCrowdMap, resolveCurrentLocation } from './controllers/locationController.js';
import facilityRoutes from './routes/facilityRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminBookingRoutes from './routes/adminBookingRoutes.js';
import { getDatabaseHealth } from './db/connection.js';

const app = express();

app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URLS,
  'http://localhost:3000',
  'http://localhost:5173',
].flatMap((value) => String(value || '').split(','))
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: false,
  optionsSuccessStatus: 204,
};
app.use((req, _res, next) => {
  console.log(`Incoming ${req.method} ${req.path} Origin: ${req.headers.origin || 'none'}`);
  next();
});
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - startedAt}ms${req.path === '/api/auth/login' ? ' login' : ''}`));
  next();
});

const health = (_req, res) => {
  res.json({ success: true, message: 'Campus Rush API is running' });
};
app.get('/health', health);
app.get('/api/health', health);
app.get('/api/health/database', async (_req, res, next) => {
  try {
    const database = await getDatabaseHealth();
    return res.status(database.connected && database.usersTable ? 200 : 503).json({ success: database.connected && database.usersTable, database });
  } catch (error) {
    return next(error);
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminBookingRoutes);

app.use('/api/locations', locationRoutes);
app.post('/api/location/current', resolveCurrentLocation);
app.get('/api/location/crowd-map', getCrowdMap);
app.use('/api/crowd', crowdRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/recommendations', recommendationRoutes);

app.use((error, _req, res, _next) => {
  console.error(`Request failed${error.code ? ` (${error.code})` : ''}`);
  const status = error.status || ({ '23505': 409, '23514': 400, '23503': 400 }[error.code] || 500);
  const message = error.status
    ? error.message
    : error.code === '23505'
      ? 'A slot with these times already exists.'
    : error.code === '23514'
      ? 'The supplied booking data is invalid.'
      : error.code === '23503'
        ? 'The selected facility or slot does not exist.'
        : 'Internal server error';
  res.status(status).json({ success: false, message });
});

export default app;
