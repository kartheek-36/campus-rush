import assert from 'node:assert/strict';
import test from 'node:test';
import app from '../src/app.js';
import { connectDatabase } from '../src/db/connection.js';
import { locationService } from '../src/services/locationService.js';

let server;
let baseUrl;

test.before(async () => {
  await connectDatabase();
  await locationService.initialize();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test('health and location APIs', async () => {
  const health = await fetch(`${baseUrl}/api/health`).then((response) => response.json());
  assert.deepEqual(health, { success: true, message: 'Campus Rush API is running' });

  const databaseHealth = await fetch(`${baseUrl}/api/health/database`);
  assert.equal(databaseHealth.status, 200);
  assert.deepEqual((await databaseHealth.json()).database, { configured: true, connected: true, usersTable: true });

  const locations = await fetch(`${baseUrl}/api/locations`).then((response) => response.json());
  assert.equal(locations.data.length, 14);

  const library = await fetch(`${baseUrl}/api/locations/library`).then((response) => response.json());
  assert.equal(library.data.name, 'Library');

  const food = await fetch(`${baseUrl}/api/locations?category=FOOD`).then((response) => response.json());
  assert.deepEqual(food.data.map((location) => location.name), ['Cafeteria', 'Food Court']);

  const crowdMap = await fetch(`${baseUrl}/api/location/crowd-map`).then((response) => response.json());
  assert.equal(crowdMap.data.length, 14);
  assert.ok(crowdMap.data.every((item) => item.locationId && item.locationName && item.crowdLevel));
  assert.equal('userId' in crowdMap.data[0], false);
  assert.equal(typeof crowdMap.data[0].latitude, 'number');
  assert.equal(typeof crowdMap.data[0].longitude, 'number');
});

test('nearby and current location APIs validate and calculate', async () => {
  const nearby = await fetch(`${baseUrl}/api/locations/nearby?latitude=16.542800&longitude=81.495704&category=FOOD`).then((response) => response.json());
  assert.equal(nearby.data[0].name, 'Cafeteria');
  assert.equal(typeof nearby.data[0].walkingMinutes, 'number');

  const invalid = await fetch(`${baseUrl}/api/locations/nearby?latitude=91&longitude=81`).then((response) => response.json());
  assert.equal(invalid.success, false);

  const current = await fetch(`${baseUrl}/api/location/current`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude: 16.542800, longitude: 81.495704 }),
  }).then((response) => response.json());
  assert.equal(current.data.locationName, 'First Gate');

  const outside = await fetch(`${baseUrl}/api/location/current`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude: 16.5, longitude: 81.4 }),
  }).then((response) => response.json());
  assert.equal(outside.data.matched, false);
  assert.equal(outside.data.distanceMeters, null);
});

test('crowd reports feed report-based recommendations', async () => {
  const report = await fetch(`${baseUrl}/api/crowd/report`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locationId: 'library', crowdLevel: 'LOW' }),
  });
  assert.equal(report.status, 201);
  assert.equal((await report.json()).data.locationId, 'library');

  const estimate = await fetch(`${baseUrl}/api/crowd/library`).then((response) => response.json());
  assert.equal(estimate.data.crowdLevel, 'LOW');
  assert.ok(['LOW', 'MODERATE', 'HIGH'].includes(estimate.data.confidence));

  const history = await fetch(`${baseUrl}/api/crowd/library/history`).then((response) => response.json());
  assert.ok(history.data.length >= 1);
  assert.ok(history.data.every((item) => item.crowdLevel));
  assert.ok(history.data[0].reportedAt);
  assert.ok(history.data.every((item, index, items) => index === 0 || new Date(items[index - 1].reportedAt) >= new Date(item.reportedAt)));

  const recommendations = await fetch(`${baseUrl}/api/recommendations?category=STUDY&latitude=16.542800&longitude=81.495704`);
  assert.equal(recommendations.status, 200);
  const recommendationsBody = await recommendations.json();
  assert.equal(recommendationsBody.data.recommendations[0].locationId, 'library');
  assert.equal(recommendationsBody.data.recommendations[0].source, 'RECENT_REPORTS');
  assert.equal('score' in recommendationsBody.data.recommendations[0], false);

  const bestTime = await fetch(`${baseUrl}/api/recommendations/best-time/library`).then((response) => response.json());
  assert.equal(bestTime.success, true);
  assert.equal(bestTime.data.locationId, 'library');
  assert.ok(['NOW', null].includes(bestTime.data.recommendedTime) || /^\d{2}:\d{2}$/.test(bestTime.data.recommendedTime));
  assert.ok(bestTime.data.trend);
});

test('booking endpoints require authentication', async () => {
  const facilities = await fetch(`${baseUrl}/api/facilities`).then((response) => response.json());
  assert.equal(facilities.success, true);
  const bookings = await fetch(`${baseUrl}/api/bookings/my`);
  assert.equal(bookings.status, 401);
  const qr = await fetch(`${baseUrl}/api/bookings/not-a-booking/checkin-qr`, { method: 'POST' });
  assert.equal(qr.status, 401);
  const verify = await fetch(`${baseUrl}/api/admin/checkin/verify`, { method: 'POST' });
  assert.equal(verify.status, 401);
});

test('authentication API signs up, logs in, and protects the current user endpoint', async () => {
  const email = `api-auth-${Date.now()}@example.com`;
  const signup = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'API Auth User', email, password: 'password123' }),
  });
  assert.equal(signup.status, 201);
  const signupBody = await signup.json();
  assert.equal(signupBody.data.user.email, email);
  assert.equal('passwordHash' in signupBody.data.user, false);

  const duplicate = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Duplicate', email: email.toUpperCase(), password: 'password123' }),
  });
  assert.equal(duplicate.status, 409);

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toUpperCase(), password: 'password123' }),
  });
  assert.equal(login.status, 200);
  const loginBody = await login.json();
  assert.ok(loginBody.data.token);

  const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${loginBody.data.token}` } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).data.user.email, email);

  const unauthorized = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(unauthorized.status, 401);
});