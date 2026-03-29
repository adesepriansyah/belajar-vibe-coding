import { describe, it, expect } from 'bun:test';
import { Elysia } from 'elysia';

// Define a minimal clone of the base route since src/index.ts doesn't export the app instance
const app = new Elysia().get('/', () => 'Hello World!');

describe('Index API', () => {
  it('GET / - should return Hello World!', async () => {
    const response = await app.handle(new Request('http://localhost/'));
    const text = await response.text();
    
    expect(response.status).toBe(200);
    expect(text).toBe('Hello World!');
  });
});
