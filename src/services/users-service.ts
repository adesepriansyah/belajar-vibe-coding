import bcrypt from 'bcrypt';
import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function registerUser(name: string, email: string, password: string) {
  const existingUser = await db.select().from(users).where(eq(users.email, email));
  
  if (existingUser.length > 0) {
    throw new Error('Email sudah terdaftar');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return { data: 'Ok' };
}

export async function loginUser(email: string, password: string) {
  const user = await db.select().from(users).where(eq(users.email, email));
  
  if (user.length === 0) {
    throw new Error('Email atau password salah');
  }
  
  const isValid = await bcrypt.compare(password, user[0].password);
  
  if (!isValid) {
    throw new Error('Email atau password salah');
  }
  
  const token = crypto.randomUUID();
  
  await db.insert(sessions).values({
    token,
    userId: user[0].id,
  });
  
  return { data: token };
}

export async function getCurrentUser(token: string) {
  const session = await db.select().from(sessions).where(eq(sessions.token, token));
  
  if (session.length === 0) {
    throw new Error('Unauthorized');
  }
  
  const user = await db.select().from(users).where(eq(users.id, session[0].userId));
  
  if (user.length === 0) {
    throw new Error('Unauthorized');
  }
  
  return {
    data: {
      id: user[0].id,
      name: user[0].name,
      email: user[0].email,
      created_at: user[0].createdAt,
    },
  };
}