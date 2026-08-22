import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './db/connection.js';
import { locationService } from './services/locationService.js';
import { bookingService } from './services/bookingService.js';

const port = Number(process.env.PORT || 5000);

try {
  await connectDatabase();
  await locationService.initialize();
  app.listen(port, () => {
    console.log(`Campus Rush backend listening on port ${port}`);
  });
  const expiryTimer = setInterval(() => { void bookingService.releaseExpiredBookings().catch(() => undefined); }, 30 * 1000);
  expiryTimer.unref();
} catch (error) {
  console.error('Unable to initialize backend:', error.message);
  process.exitCode = 1;
}
