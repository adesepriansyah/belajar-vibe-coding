import { Elysia, t } from 'elysia';
import { registerUser, loginUser } from '../services/users-service';

export const usersRoute = new Elysia()
  .post('/api/users', async ({ body }) => {
    const { name, email, password } = body;
    
    try {
      const result = await registerUser(name, email, password);
      return result;
    } catch (error: any) {
      if (error.message === 'Email sudah terdaftar') {
        return { error: 'Email sudah terdaftar' };
      }
      return { error: 'Internal server error' };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 })
    })
  })
  .post('/api/users/login', async ({ body }) => {
    const { email, password } = body;
    
    try {
      const result = await loginUser(email, password);
      return result;
    } catch (error: any) {
      if (error.message === 'Email atau password salah') {
        return { error: 'Email atau password salah' };
      }
      return { error: 'Internal server error' };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 })
    })
  });