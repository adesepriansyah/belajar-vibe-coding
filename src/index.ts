import { Elysia } from 'elysia';
import { registerUserHandler } from './routes/users-route';

const app = new Elysia()
  .get('/', () => 'Hello World!')
  .post('/api/users', registerUserHandler)
  .listen(Number(process.env.PORT) || 3000);

console.log(`Server running at http://localhost:${app.server?.port}`);

export type App = typeof app;