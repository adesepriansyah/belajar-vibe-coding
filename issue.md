# Issue: User Login API

## Deskripsi
Membuat fitur login user dengan menghasilkan token sesi menggunakan UUID.

---

## Spesifikasi

### Database - Tabel Sessions

Buat tabel `sessions` dengan struktur berikut:

| Kolom      | Tipe          | Constraint                                   |
|------------|---------------|----------------------------------------------|
| id         | INTEGER       | AUTO INCREMENT, PRIMARY KEY                 |
| token      | VARCHAR(255)  | NOT NULL                                     |
| userId     | INTEGER       | NOT NULL, FK ke tabel users (id)            |
| createdAt  | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                   |

**Catatan**: 
- `token` menggunakan UUID yang di-generate saat login
- Setiap login akan membuat token baru (tidak menggunakan session token yang sama)

---

### API Endpoint

**Endpoint**: `POST /api/users/login`

**Request Body**:
```json
{
  "email": "ade@gmail.com",
  "password": "rahasia"
}
```

**Catatan**: Request body hanya butuh `email` dan `password` (tidak perlu `name`)

**Response Success** (HTTP 200):
```json
{
  "data": "Token"
}
```
Contoh response: `{"data":"550e8400-e29b-41d4-a716-446655440000"}`

**Response Error** - Email atau password salah (HTTP 401):
```json
{
  "error": "Email atau password salah"
}
```

---

## Struktur Folder

```
src/
├── routes/
│   └── users-route.ts
└── services/
    └── users-service.ts
```

**Catatan**: File `users-route.ts` dan `users-service.ts` sudah ada dari fitur sebelumnya. Tambahkan function baru, jangan overwrite file yang sudah ada.

---

## Tahapan Implementasi

### Tahap 1: Setup Database

1. **Tambahkan kolom sessions ke schema**
   - Buka file `src/db/schema.ts`
   - Import `mysqlTable`, `serial`, `varchar`, `timestamp`, `sql` dari `drizzle-orm/mysql-core`
   - Import `users` dari file yang sama
   
2. **Definisikan tabel sessions**
   ```ts
   export const sessions = mysqlTable('sessions', {
     id: serial('id').primaryKey(),
     token: varchar('token', { length: 255 }).notNull(),
     userId: integer('user_id').notNull().references(() => users.id),
     createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
   });
   ```

3. **Generate dan push migration**
   ```bash
   bun run db:generate
   bun run db:push
   ```

---

### Tahap 2: Update Service Layer

1. **Buka file `src/services/users-service.ts`**
   
2. **Import module yang dibutuhkan**
   ```ts
   import { db } from '../db';
   import { sessions } from '../db/schema';
   import crypto from 'crypto';
   ```

3. **Buat fungsi loginUser**
   - Terima parameter: `email`, `password`
   - Cari user berdasarkan email
   - Jika tidak ditemukan, return error "Email atau password salah"
   - Bandingkan password dengan hash yang tersimpan di database menggunakan `bcrypt.compare()`
   - Jika tidak cocok, return error "Email atau password salah"
   - Jika cocok, generate UUID menggunakan `crypto.randomUUID()`
   - Insert token ke tabel sessions dengan userId
   - Return token

4. **Contoh struktur fungsi**:
   ```ts
   import bcrypt from 'bcrypt';
   import { eq } from 'drizzle-orm';
   import { users } from '../db/schema';
   import { sessions } from '../db/schema';

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
   ```

---

### Tahap 3: Update Route Layer

1. **Buka file `src/routes/users-route.ts`**
   
2. **Import service function**
   ```ts
   import { loginUser } from '../services/users-service';
   ```

3. **Tambahkan route POST /api/users/login ke existing usersRoute**
   ```ts
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
   ```

---

### Tahap 4: Testing

1. **Test login berhasil**
   ```bash
   curl -X POST http://localhost:3000/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"ade@gmail.com","password":"rahasia"}'
   ```
   Expected: `{"data":"<uuid-token>"}`

2. **Test email tidak terdaftar**
   ```bash
   curl -X POST http://localhost:3000/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"tidakada@gmail.com","password":"password"}'
   ```
   Expected: `{"error":"Email atau password salah"}`

3. **Test password salah**
   ```bash
   curl -X POST http://localhost:3000/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"ade@gmail.com","password":"salah"}'
   ```
   Expected: `{"error":"Email atau password salah"}`

---

## Catatan Penting

1. **Gunakan bcrypt.compare()** untuk membandingkan password hash - jangan menggunakan === secara langsung
2. **Gunakan crypto.randomUUID()** untuk menghasilkan token yang unik
3. **Selalu simpan token baru** ke tabel sessions setiap kali user login (tidak perlu menghapus token lama)
4. **Ikuti konvensi yang ada** - gunakan nama function, import style, dan pattern yang sama dengan kode yang sudah ada
5. **Validasi input** - gunakan `t.Object` dari Elysia untuk validasi email format dan password minLength

---

## Files yang Perlu Diubah

1. `src/db/schema.ts` - tambahkan definisi tabel sessions
2. `src/services/users-service.ts` - tambahkan fungsi loginUser
3. `src/routes/users-route.ts` - tambahkan route POST /api/users/login