# Next Session Notes

## Status Terakhir
- Commit terbaru: `1032214` `chore: prepare production proxy setup for gezy domain`
- Branch aktif: `main`
- Remote push terakhir: berhasil ke `origin/main`
- Deploy production ke VPS sudah dijalankan dari folder `~/gezy`
- Domain `https://gezy.my.id` sudah aktif dengan SSL Let's Encrypt

## Konteks Deployment Production
- Domain target: `gezy.my.id`
- Reverse proxy publik yang sudah berjalan di VPS: `sims_nginx`
- Network Docker publik yang sudah ada di VPS: `sims_edge`
- Network internal app `go-toko` tetap terpisah agar database dan Redis tidak terekspos

## Keputusan Arsitektur
- `sims_nginx` tetap menjadi entrypoint publik pada port `80/443`
- `go-toko-web` tidak publish port host
- `go-toko-web` join ke network eksternal `sims_edge`
- `go-toko-app`, `go-toko-postgres`, dan `go-toko-redis` hanya berjalan di network internal
- `postgres` dan `redis` tidak membuka port ke host publik

## File Yang Sudah Disiapkan
- [docker-compose.prod.yml](/home/pgun/dev/go-toko/docker-compose.prod.yml)
- [.env.production.example](/home/pgun/dev/go-toko/.env.production.example)
- [docs/gezy.my.id.nginx.conf](/home/pgun/dev/go-toko/docs/gezy.my.id.nginx.conf)

## Isi Perubahan Penting
- `docker-compose.prod.yml`
  - `web` memakai image GHCR dan join ke `sims_edge`
  - `app`, `postgres`, `redis` tetap internal-only
  - `edge` dideklarasikan sebagai external network
- `.env.production.example`
  - domain default diarahkan ke `https://gezy.my.id`
  - `EDGE_NETWORK` default: `sims_edge`
- `docs/gezy.my.id.nginx.conf`
  - contoh server block nginx untuk proxy `gezy.my.id` ke `go-toko-web:80`

## Langkah Deploy Di VPS
1. Pull repo terbaru
2. Buat `.env.production` dari `.env.production.example`
3. Isi secret yang wajib:
   - `DB_PASSWORD`
   - `TOKEN_KEY_HEX`
   - kredensial Google OAuth jika dipakai
4. Jalankan:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

5. Tambahkan server block dari [docs/gezy.my.id.nginx.conf](/home/pgun/dev/go-toko/docs/gezy.my.id.nginx.conf) ke konfigurasi `sims_nginx`

## Kondisi VPS Yang Sudah Terkonfirmasi
- Port publik yang sedang dipakai:
  - `80`
  - `443`
  - `22`
- `8080` kosong, tetapi untuk setup final tidak dipakai lagi
- Container `sims_nginx` sudah join ke:
  - `sims_edge`
  - `sims_internal`
- Folder deploy app production:
  - `~/gezy`
- Container production `go-toko` yang aktif:
  - `go-toko-web`
  - `go-toko-app`
  - `go-toko-postgres`
  - `go-toko-redis`

## Konfigurasi Production Yang Sudah Aktif di VPS
- Repo `go-toko` sudah di-clone ke `~/gezy` pada commit `1032214`
- File env production aktif:
  - `~/gezy/.env.production`
- `go-toko-web` sudah join ke network:
  - `gezy_backend`
  - `sims_edge`
- Reverse proxy `sims_nginx` sudah memiliki HTTP dan HTTPS server block untuk `gezy.my.id`
- Sertifikat aktif untuk `gezy.my.id`:
  - issuer: `Let's Encrypt R12`
  - berlaku sampai `2026-06-17`
- Lokasi sertifikat yang dipakai `sims_nginx`:
  - `/home/pakgun/sims/docker/nginx/ssl/gezy.my.id/fullchain.pem`
  - `/home/pakgun/sims/docker/nginx/ssl/gezy.my.id/privkey.pem`

## Otomasi Renew SSL
- Certbot issuance memakai webroot:
  - `/home/pakgun/certbot/www`
- Renewal config:
  - `/home/pakgun/certbot/conf/renewal/gezy.my.id.conf`
- Deploy hook otomatis sudah dipasang:
  - `/home/pakgun/certbot/conf/renewal-hooks/deploy/gezy-my-id-sync.sh`
- Hook renew akan:
  - copy cert terbaru ke folder SSL `sims_nginx`
  - menjalankan `nginx -t`
  - reload `sims_nginx`

## Hasil Verifikasi Terakhir
- `https://gezy.my.id` merespons `200 OK`
- Sertifikat live:
  - `CN = gezy.my.id`
  - issuer: `Let's Encrypt R12`
- Response root menampilkan frontend `go-toko-web`

## GHCR
- Workflow publish image sudah disiapkan di [publish-image.yaml](/home/pgun/dev/go-toko/.github/workflows/publish-image.yaml)
- Image target:
  - `ghcr.io/gunanto/go-toko-app`
  - `ghcr.io/gunanto/go-toko-web`
- Trigger:
  - push ke `main`
  - tag `v*`
  - manual `workflow_dispatch`

## Next Action Yang Paling Relevan
1. Tambahkan catatan operasional untuk proses renew SSL dan deploy production ke dokumentasi utama bila perlu
2. Verifikasi endpoint aplikasi penting di production (`/`, auth, API store) lewat browser/manual smoke test
3. Jika ingin memakai Cloudflare proxy, ubah record dari `DNS only` ke `Proxied` setelah memastikan perilaku origin sudah stabil
4. Siapkan prosedur update image tag selain `main` bila nanti mau pakai versi release/tag
