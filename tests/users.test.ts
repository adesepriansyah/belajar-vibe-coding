import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { Elysia } from 'elysia';

// Mock the users-service before importing the route that uses it
mock.module('../src/services/users-service', () => {
  return {
    registerUser: mock(),
    loginUser: mock(),
    getCurrentUser: mock(),
    logoutUser: mock()
  };
});

// Import after mocking
import { usersRoute } from '../src/routes/users-route';
import * as usersService from '../src/services/users-service';

const app = new Elysia().use(usersRoute);

describe('Users API', () => {
  beforeEach(() => {
    // Reset mocks before each test
    usersService.registerUser.mockReset();
    usersService.loginUser.mockReset();
    usersService.getCurrentUser.mockReset();
    usersService.logoutUser.mockReset();
  });

  describe('POST /api/users (Registration)', () => {
    it('Success: Should register a valid user', async () => {
      usersService.registerUser.mockResolvedValue({ id: 1, name: 'Test', email: 'test@example.com' });

      const response = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'password123' })
        })
      );
      
      expect(response.status).toBe(200);
      expect(usersService.registerUser).toHaveBeenCalled();
    });

    it('Fail: Invalid email format', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test User', email: 'invalidemail', password: 'password123' })
        })
      );
      
      expect(response.status).toBe(422); // Elysia Validation Error
      expect(usersService.registerUser).not.toHaveBeenCalled();
    });

    it('Fail: Password too short', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'short' })
        })
      );
      
      expect(response.status).toBe(422);
    });

    it('Fail: Payload Name too long (>255)', async () => {
      const longName = 'A'.repeat(300);
      const response = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: longName, email: 'test@example.com', password: 'password123' })
        })
      );
      
      expect(response.status).toBe(422);
    });

    it('Fail: Duplicate email', async () => {
      usersService.registerUser.mockRejectedValue(new Error('Email sudah terdaftar'));

      const response = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test User', email: 'duplicate@example.com', password: 'password123' })
        })
      );
      
      const body = await response.json();
      expect(body.error).toBe('Email sudah terdaftar');
    });

    it('Fail: Missing field', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }) // missing name
        })
      );
      
      expect(response.status).toBe(422);
    });
  });

  describe('POST /api/users/login (Login)', () => {
    it('Success: Valid credentials', async () => {
      usersService.loginUser.mockResolvedValue({ data: 'mocked-token-here' });

      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        })
      );
      
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.data).toBe('mocked-token-here');
    });

    it('Fail: Incorrect password or email', async () => {
      usersService.loginUser.mockRejectedValue(new Error('Email atau password salah'));

      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' })
        })
      );
      
      const body = await response.json();
      expect(body.error).toBe('Email atau password salah');
    });

    it('Fail: Payload exceeds max length', async () => {
      const longEmail = 'A'.repeat(300) + '@example.com';
      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: longEmail, password: 'password123' })
        })
      );
      
      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/users/me (Get Profile)', () => {
    it('Success: Valid token', async () => {
      usersService.getCurrentUser.mockResolvedValue({ id: 1, name: 'Test', email: 'test@example.com' });

      const response = await app.handle(
        new Request('http://localhost/api/users/me', {
          method: 'GET',
          headers: { 'Authorization': 'Bearer valid-token-here' }
        })
      );
      
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.name).toBe('Test');
    });

    it('Fail: No Authorization header', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/me', {
          method: 'GET'
        })
      );
      
      expect(response.status).toBe(401);
    });

    it('Fail: Invalid Header Format', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/me', {
          method: 'GET',
          headers: { 'Authorization': 'valid-token-only-without-bearer' }
        })
      );
      
      expect(response.status).toBe(401);
    });

    it('Fail: Invalid or Expired Token', async () => {
      usersService.getCurrentUser.mockRejectedValue(new Error('Unauthorized'));

      const response = await app.handle(
        new Request('http://localhost/api/users/me', {
          method: 'GET',
          headers: { 'Authorization': 'Bearer invalid-token' }
        })
      );
      
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/users/logout (Logout)', () => {
    it('Success: Valid token', async () => {
      usersService.logoutUser.mockResolvedValue({ data: 'Ok' });

      const response = await app.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer valid-token-here' }
        })
      );
      
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.data).toBe('Ok');
    });

    it('Fail: No Authorization header', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE'
        })
      );
      
      expect(response.status).toBe(401);
    });

    it('Fail: Invalid Session / Token not found', async () => {
      usersService.logoutUser.mockRejectedValue(new Error('Unauthorized'));

      const response = await app.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer dead-token' }
        })
      );
      
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });
});
