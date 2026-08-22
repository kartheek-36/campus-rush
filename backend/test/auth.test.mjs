import assert from 'node:assert/strict';
import test from 'node:test';
import { authService } from '../src/services/authService.js';

test('auth service hashes passwords and returns safe users', async () => {
  const email = `auth-${Date.now()}@example.com`;
  const user = await authService.signup({ name: 'Auth Test', email, password: 'password123' });
  assert.equal(user.email, email);
  assert.equal('passwordHash' in user, false);
  assert.equal('password' in user, false);

  const login = await authService.login(email.toUpperCase(), 'password123');
  assert.equal(login.user.email, email);
  assert.ok(login.token);
  assert.equal(await authService.login(email, 'wrong-password'), null);
});