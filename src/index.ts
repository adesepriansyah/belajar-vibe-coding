import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { usersRoute } from './routes/users-route';

const app = new Elysia()
  .use(swagger({
    documentation: {
        info: {
            title: 'Belajar Vibe Coding API',
            version: '1.0.0'
        }
    }
  }))
  .use(usersRoute)
  .get('/', () => 'Hello World!')
  .listen(Number(process.env.PORT) || 3000);

console.log(`Server running at http://localhost:${app.server?.port}`);

export type App = typeof app;