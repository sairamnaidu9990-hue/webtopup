# Deploy Production

## Struktur deploy monorepo

- `apps/frontend` -> Vercel
- `apps/admin` -> VPS
- `apps/backend` -> VPS

## Vercel frontend

1. Import repository ke Vercel.
2. Buat project untuk `apps/frontend`.
3. Set `Root Directory` ke `apps/frontend`.
4. Set `Production Branch` ke `main`.
5. Isi environment variables frontend production yang dibutuhkan.
6. Hubungkan domain production frontend ke project ini.

Referensi resmi:
- https://vercel.com/docs/git
- https://vercel.com/docs/monorepos

## VPS admin + backend

Repository di server disarankan berada di:

```bash
/var/www/webtopup
```

PM2 akan menjalankan:

- admin pada `127.0.0.1:3001`
- backend pada `127.0.0.1:4000`

File PM2:

```bash
ecosystem.config.cjs
```

## GitHub Actions secrets

Tambahkan secrets berikut di repository GitHub:

- `VPS_HOST`
- `VPS_USER`
- `VPS_APP_DIR`
- `VPS_SSH_KEY`

Contoh:

- `VPS_HOST=139.59.106.102`
- `VPS_USER=root`
- `VPS_APP_DIR=/var/www/webtopup`

## Alur deploy

Setiap push ke `main` akan:

1. Menarik perubahan terbaru di VPS.
2. Build admin.
3. Menjalankan smoke test backend.
4. Reload PM2 untuk admin dan backend.

Vercel akan otomatis deploy frontend dari branch `main` lewat Git integration.

## Langkah awal di VPS

Clone repo dan install dependency pertama kali:

```bash
cd /var/www
git clone <repo-url> webtopup
cd /var/www/webtopup/apps/admin
npm ci
cd ../backend
npm ci
cd /var/www/webtopup
pm2 startOrReload ecosystem.config.cjs --env production
pm2 save
```

## Rekomendasi domain

- `kitagg.com` -> Vercel frontend
- `www.kitagg.com` -> Vercel frontend
- `admin.kitagg.com` -> VPS admin
- `api.kitagg.com` -> VPS backend

