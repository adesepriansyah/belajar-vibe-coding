import bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '../db/schema';
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