import test from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultAdminCredentials } from '../src/models/usermodel.js';

test('returns default admin credentials with sensible fallback values', () => {
  const admin = getDefaultAdminCredentials();

  assert.equal(admin.username, 'admin');
  assert.equal(admin.email, 'admin@example.com');
  assert.equal(admin.password, 'admin123');
  assert.equal(admin.role, 'admin');
});
