# Local Development

Gunakan branch selain `main` untuk eksperimen, misalnya:

```bash
git checkout main
git pull origin main
git checkout -b feature/nama-fitur
```

## Env lokal

File berikut dipakai untuk local dan tidak ikut ke git:

- `apps/frontend/.env.local`
- `apps/admin/.env.local`
- `apps/backend/.env`

Contoh tracked di repo:

- `apps/frontend/.env.local.example`
- `apps/admin/.env.local.example`
- `apps/backend/.env.example`
- `apps/backend/.env.atlas-dev.example`

Nilai lokal default:

- frontend: `http://localhost:3000`
- admin: `http://localhost:3001`
- backend: `http://127.0.0.1:4000`

Catatan backend dev:

- `apps/backend/.env` sebaiknya memakai database dev/lokal, bukan database production
- isi credential BangJeff dan Tokopay dengan key staging/dev jika memang perlu dites
- jika belum butuh integrasi payment/provider, placeholder boleh dibiarkan agar tidak menyentuh service live
- jika memakai Atlas dev, mulai dari `apps/backend/.env.atlas-dev.example` lalu salin isinya ke `apps/backend/.env`

## Menjalankan app lokal

Jalankan tiap app di terminal terpisah:

```bash
cd apps/backend
npm run dev
```

```bash
cd apps/admin
npm run dev
```

```bash
cd apps/frontend
npm run dev
```

## Catatan deploy

- `push` ke `main` akan memicu deploy production
- `push` ke branch fitur aman untuk eksperimen code
- env Vercel dan VPS tetap terpisah dari env lokal
