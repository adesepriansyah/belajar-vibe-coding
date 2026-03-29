# Issue: Implementasi Dokumentasi API Menggunakan Swagger

## Deskripsi
Tugas ini bertujuan untuk menambahkan pustaka dan antarmuka interaktif **Swagger (OpenAPI)** ke dalam proyek. 
Swagger memungkinkan *developer* lain atau tim komponen antarmuka pengguna (*Frontend*) membaca, memahami struktur input yang diperlukan, hingga mencoba langsung (testing) respon API tanpa keluar dari aplikasi *browser*.

Mengingat proyek kita berbasis **ElysiaJS**, ada pustaka resmi yang dapat mengubah schema (`t.Object`) Route menjadi halaman Swagger UI mutakhir secara mulus tanpa banyak kendala.

---

## 📋 Tahapan Implementasi (Target: Junior Programmer / AI Assistant)

Tugas Anda adalah membaca setiap langkah di bawah dan memprogramnya bertahap.

### Langkah 1: Instalasi Pustaka
ElysiaJS memisahkan pustaka Swagger untuk efektivitas kinerja inti.
Tugas pertama, jalankan perintah instalasi berikut di *terminal*:

```bash
bun add @elysiajs/swagger
```

### Langkah 2: Aktivasi Plugin Swagger di Server Utama
**Target File:** `src/index.ts`

Tambahkan pemanggilan *use* untuk me-registrasikan *plugin* swagger ke dalam struktur *chaining* dari framework Elysia.

**Kode Sebelum:**
```typescript
import { Elysia } from 'elysia';
import { usersRoute } from './routes/users-route';

const app = new Elysia()
  .use(usersRoute)
  ...
```

**Kode Sesudah yang Diharapkan:**
```typescript
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger'; // <- Tambahan Import
import { usersRoute } from './routes/users-route';

const app = new Elysia()
  // <- Tambahan Plugin Swagger
  .use(swagger({
    documentation: {
        info: {
            title: 'Belajar Vibe Coding API Documentation',
            version: '1.0.0'
        }
    }
  }))
  .use(usersRoute)
  ...
```

### Langkah 3: Menambahkan Metadata Deskripsi Per-Endpoint
**Target File:** `src/routes/users-route.ts`

Plugin `@elysiajs/swagger` secara otomatis mendeteksi objek validasi seperti `t.Object` untuk mengkompilasi dokumentasinya. Namun agar API lebih mudah dibaca, **kita perlu memberikan penjelasan yang sangat eksplisit** untuk tiap Endpoint.

Di ElysiaJS, informasi tambahan disisipkan memakai properti `detail: { ... }` pada *object handler route* milik Elysia.

**Contoh Adaptasi untuk Endpoint Pertama (`POST /api/users`):**
```typescript
  .post('/api/users', async ({ body }) => { 
     // .. Isi Logika Service
  }, {
    body: t.Object({
       ... // (aturan dari endpoint yang ada, jangan ikut dibuang)
    }),
    // TAMBAHKAN IDENTIFIER DETAIL SEPERTI INI:
    detail: {
      tags: ['App Authentication'],
      summary: 'Endpoint Registrasi User',
      description: 'Mencatat pengguna baru ke database setelah divalidasi tidak memuat karakter lebih dari 255 serta mengunci keamanan dengan Hash bcrypt.'
    }
  })
```

**Tugas Eksekusi:**
Masukkan konfigurasi `detail: { tags: string[], summary: string, description: string }` ke dalam **KEEMPAT (4)** endpoint yang tersedia secara berurutan:
1. `POST /api/users` (Deksripsinya tentang proses register *Auth*)
2. `POST /api/users/login` (Deskripsinya mencatat verifikasi kredensial)
3. `GET /api/users/me` (Deskripsinya melihat data berbekal token)
4. `DELETE /api/users/logout` (Deskripsinya mencabut keandalan *sesi login*)

*(Pastikan grup string parameter `tags` milik keempat endpoint itu disamakan, contoh: `['Authentication']`, agar menumpuk / grouping menjadi rapi di UI).*

### Langkah 4: Validasi & Pengujian Manual (Testing)
1. Setelah modifikasi selesai, pastikan server jalan melalui `bun run dev`
2. Kunjungi `http://localhost:3000/swagger` langsung dari *Google Chrome/Safari* dsb.
3. Apakah aplikasi menyuguhkan halaman modern dari *Swagger UI* berserta grup API?
4. Cobalah mengisi data di skema **Registration** dari fitur "*Try it out*" untuk membuktikan endpoint bereaksi normal.

---

## ✅ Kriteria Penerimaan (*Acceptance Criteria*)
- File `package.json` memuat referensi paket `@elysiajs/swagger`.
- Rute `/swagger` bisa diakses dari sisi luar (klien) dan tampil sempurna.
- Semua titik-titik (Endpoint Auth) berada dalam suatu kotak (*grouping*) yang dinamakan 'Authentication' sesuai instruksi tag.
