import { Elysia } from 'elysia';

const app = new Elysia()
  .get('/', () => 'Hello World!')
  .listen(Number(process.env.PORT) || 3000);

console.log(`Server running at http://localhost:${app.server?.port}`);

export type App = typeof app;