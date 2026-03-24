import { registerUser } from '../services/users-service';

export const registerUserRoute = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' },
      password: { type: 'string' },
    },
    required: ['name', 'email', 'password'],
  },
} as const;

export async function registerUserHandler({ body }: { body: any }) {
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return Response.json({ error: 'Semua field wajib diisi' }, { status: 400 });
  }

  if (password.length < 6) {
    return Response.json(
      { error: 'Password minimal 6 karakter' },
      { status: 400 }
    );
  }

  try {
    const result = await registerUser(name, email, password);
    return Response.json(result, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Email sudah terdaftar') {
      return Response.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}