import bcrypt from 'bcrypt';
import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Mendaftarkan pengguna baru ke dalam database.
 * Fungsi ini akan mengecek apakah email sudah digunakan, melakukan hashing pada password,
 * lalu menyimpan data pengguna baru ke tabel `users`.
 * 
 * @param name - Nama lengkap pengguna
 * @param email - Alamat email pengguna (harus unik)
 * @param password - Kata sandi pengguna dalam bentuk plain-text
 * @returns Object berisi pesan keberhasilan `{ data: 'Ok' }`
 * @throws Error jika email sudah terdaftar di database
 */
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

/**
 * Melakukan proses otentikasi login pengguna.
 * Fungsi ini memvalidasi keberadaan email, memverifikasi kecocokan hash password,
 * lalu membuat sesi baru dengan token unik yang disimpan di tabel `sessions`.
 * 
 * @param email - Alamat email pengguna
 * @param password - Kata sandi pengguna
 * @returns Object berisi token otentikasi `{ data: token }`
 * @throws Error jika email tidak ditemukan atau password tidak cocok
 */
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

/**
 * Mengambil detail profil pengguna yang sedang login berdasarkan token sesi.
 * Fungsi ini akan memverifikasi token dari tabel `sessions`, lalu
 * mengambil data pengguna yang berelasi dari tabel `users`.
 * 
 * @param token - Token otentikasi Bearer (UUID)
 * @returns Object berisi profil pengguna `{ data: { id, name, email, created_at } }`
 * @throws Error 'Unauthorized' jika token tidak valid atau pengguna tidak ditemukan
 */
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

/**
 * Memutuskan sesi (logout) dari pengguna yang sedang login.
 * Fungsi ini memvalidasi ketersediaan token di tabel `sessions` dan
 * menghapusnya dari database untuk merevokasi akses dari client.
 * 
 * @param token - Token otentikasi Bearer (UUID) yang ingin dihapus
 * @returns Object berisi pesan keberhasilan `{ data: 'Ok' }`
 * @throws Error 'Unauthorized' jika sesi tidak ditemukan
 */
export async function logoutUser(token: string) {
  const session = await db.select().from(sessions).where(eq(sessions.token, token));
  
  if (session.length === 0) {
    throw new Error('Unauthorized');
  }
  
  await db.delete(sessions).where(eq(sessions.token, token));
  
  return { data: 'Ok' };
}
