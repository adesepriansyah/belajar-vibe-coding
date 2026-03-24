import { Elysia, t } from 'elysia';
import { registerUser, loginUser, getCurrentUser, logoutUser } from '../services/users-service';

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

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
  })
  .get('/api/users/me', async ({ headers }) => {
    const token = extractToken(headers.authorization);
    
    if (!token) {
      return { error: 'Unauthorized' };
    }
    
    try {
      const result = await getCurrentUser(token);
      return result;
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        return { error: 'Unauthorized' };
      }
      return { error: 'Internal server error' };
    }
  })
  .delete('/api/users/logout', async ({ headers }) => {
    const token = extractToken(headers.authorization);
    
    if (!token) {
      return { error: 'Unauthorized' };
    }
    
    try {
      const result = await logoutUser(token);
      return result;
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        return { error: 'Unauthorized' };
      }
      return { error: 'Internal server error' };
    }
  });
