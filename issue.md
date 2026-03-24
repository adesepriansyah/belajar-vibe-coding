# Issue: Get Current User API

## Deskripsi
Membuat API untuk mendapatkan data user yang sedang login berdasarkan token di Authorization header.

---

## Spesifikasi

### API Endpoint

**Endpoint**: `GET /api/users/me`

**Headers**:
```
Authorization: Bearer <token>
```

**Catatan**: 
- Token adalah UUID yang tersimpan di tabel `sessions`
- Format header harus menggunakan prefix `Bearer ` (dengan spasi setelah Bearer)
- Token didapatkan dari response login: `{"data":"<uuid-token>"}`

**Response Success** (HTTP 200):
```json
{
  "data": {
    "id": 1,
    "name": "ade",
    "email": "ade@gmail.com",
    "created_at": "2024-01-15 10:30:00"
  }
}
```

**Response Error** - Token tidak valid/tidak ditemukan (HTTP 401):
```json
{
  "error": "Unauthorized"
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

**Catatan**: File `users-route.ts` dan `users-service.ts` sudah ada. Tambahkan function baru, jangan overwrite file yang sudah ada.

---

## Tahapan Implementasi

### Tahap 1: Update Service Layer

1. **Buka file `src/services/users-service.ts`**
   
2. **Import module yang dibutuhkan**
   ```ts
   import { eq } from 'drizzle-orm';
   import { sessions, users } from '../db/schema';
   ```

3. **Buat fungsi getCurrentUser**
   - Terima parameter: `token` (string)
   - Cari session di tabel `sessions` berdasarkan token
   - Jika tidak ditemukan, throw error "Unauthorized"
   - Jika ditemukan, ambil user berdasarkan `userId` dari session
   - Return data user (id, name, email, createdAt)

4. **Contoh struktur fungsi**:
   ```ts
   export async function getCurrentUser(token: string) {
     // 1. Cari session berdasarkan token
     const session = await db.select().from(sessions).where(eq(sessions.token, token));
     
     if (session.length === 0) {
       throw new Error('Unauthorized');
     }
     
     // 2. Cari user berdasarkan userId dari session
     const user = await db.select().from(users).where(eq(users.id, session[0].userId));
     
     if (user.length === 0) {
       throw new Error('Unauthorized');
     }
     
     // 3. Return data user (tanpa password)
     return {
       data: {
         id: user[0].id,
         name: user[0].name,
         email: user[0].email,
         created_at: user[0].createdAt,
       }
     };
   }
   ```

---

### Tahap 2: Update Route Layer

1. **Buka file `src/routes/users-route.ts`**
   
2. **Import service function**
   ```ts
   import { getCurrentUser } from '../services/users-service';
   ```

3. **Tambahkan route GET /api/users/me ke existing usersRoute**
   
   Di Elysia, untuk mengakses headers gunakan parameter `headers`:
   ```ts
   .get('/api/users/me', async ({ headers }) => {
     // 1. Ambil header Authorization
     const authHeader = headers.authorization;
     
     // 2. Cek apakah header ada dan formatnya benar
     if (!authHeader || !authHeader.startsWith('Bearer ')) {
       return { error: 'Unauthorized' };
     }
     
     // 3. Extract token (hapus prefix "Bearer ")
     const token = authHeader.substring(7);
     
     // 4. Panggil service
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
   ```

---

### Tahap 3: Testing

1. **Login dulu untuk mendapatkan token**
   ```bash
   curl -X POST http://localhost:3000/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"ade@gmail.com","password":"rahasia"}'
   ```
   Expected: `{"data":"<token-uuid>"}`
   
   Simpan token tersebut.

2. **Test get current user dengan token valid**
   ```bash
   curl -X GET http://localhost:3000/api/users/me \
     -H "Authorization: Bearer <token-yang-didapat>"
   ```
   Expected: `{"data":{"id":1,"name":"ade","email":"ade@gmail.com","created_at":"..."}}`

3. **Test tanpa Authorization header**
   ```bash
   curl -X GET http://localhost:3000/api/users/me
   ```
   Expected: `{"error":"Unauthorized"}`

4. **Test dengan token tidak valid**
   ```bash
   curl -X GET http://localhost:3000/api/users/me \
     -H "Authorization: Bearer token-salah-123"
   ```
   Expected: `{"error":"Unauthorized"}`

5. **Test dengan format header salah (tanpa Bearer)**
   ```bash
   curl -X GET http://localhost:3000/api/users/me \
     -H "Authorization: token-yang-benar"
   ```
   Expected: `{"error":"Unauthorized"}`

---

## Catatan Penting

1. **Selalu gunakan Bearer prefix** - Authorization header harus formatnya `Bearer <token>`, bukan langsung token saja
2. **Substring 7 karakter** - Untuk mengambil token setelah "Bearer ", gunakan `substring(7)` atau `slice(7)`
3. **Jangan return password** - Pastikan tidak mengembalikan field `password` ke client
4. **HTTP Status Code** - Gunakan 401 untuk Unauthorized
5. **Cek null/undefined** - Pastikan authHeader tidak null sebelum memanggil `.startsWith()`
6. **Ikuti konvensi** - Gunakan pattern yang sama dengan route yang sudah ada

---

## Files yang Perlu Diubah

1. `src/services/users-service.ts` - tambahkan fungsi getCurrentUser
2. `src/routes/users-route.ts` - tambahkan route GET /api/users/me