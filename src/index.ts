import { Elysia } from 'elysia';
import { usersRoute } from './routes/users-route';

const app = new Elysia()
  .use(usersRoute)
  .get('/', () => 'Hello World!')
  .listen(Number(process.env.PORT) || 3000);

console.log(`Server running at http://localhost:${app.server?.port}`);

export type App = typeof app;