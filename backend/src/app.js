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

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (process.env.ALLOW_NETLIFY_SUBDOMAINS !== 'false' && /^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin))) return callback(null, true);
    return callback(new Error('CORS origin is not allowed.'));
  },
}));
app.use(express.json());
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - startedAt}ms`));
  next();
});

const health = (_req, res) => {
  res.json({ success: true, message: 'Campus Rush API is running' });
};
app.get('/health', health);
app.get('/api/health', health);
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
