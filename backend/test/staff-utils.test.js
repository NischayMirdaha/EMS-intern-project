import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdminRole, isStaffRole, sanitizeStaff } from '../src/staff/staffUtils.js';

test('accepts known education staff roles', () => {
  assert.equal(isStaffRole('teacher'), true);
  assert.equal(isStaffRole('accountant'), true);
  assert.equal(isStaffRole('librarian'), true);
  assert.equal(isStaffRole('student'), false);
});

test('recognizes the admin role for management access', () => {
  assert.equal(isAdminRole('admin'), true);
  assert.equal(isAdminRole('teacher'), false);
  assert.equal(isAdminRole(''), false);
});

test('sanitizes staff data with profile details', () => {
  const staff = sanitizeStaff({
    user: {
      id: 7,
      username: 'Amina',
      email: 'amina@example.com',
      role: 'teacher',
      isVerified: true,
      createdAt: '2026-07-16T00:00:00.000Z',
      updatedAt: '2026-07-16T00:00:00.000Z',
    },
    profile: {
      department: 'Science',
      position: 'Senior Teacher',
      phone: '0712345678',
      is_active: true,
      updated_at: '2026-07-16T00:30:00.000Z',
    },
  });

  assert.deepEqual(staff, {
    id: 7,
    username: 'Amina',
    email: 'amina@example.com',
    role: 'teacher',
    department: 'Science',
    position: 'Senior Teacher',
    phone: '0712345678',
    isActive: true,
    createdAt: '2026-07-16T00:00:00.000Z',
    updatedAt: '2026-07-16T00:30:00.000Z',
  });
});
