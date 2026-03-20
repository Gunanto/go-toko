# Go POS

Go POS is a full-stack Point of Sale application built for learning and iterating on Hexagonal Architecture in Go, with a React-based web dashboard for daily operations.

Go POS adalah aplikasi Point of Sale full-stack yang dibangun untuk belajar dan mengembangkan Hexagonal Architecture di Go, dengan dashboard web berbasis React untuk operasional harian.

The repository contains:

Repositori ini mencakup:

- A REST API written in Go using Gin
- PostgreSQL for transactional data storage
- Redis for caching
- A React + Vite frontend for POS workflows and operational dashboards
- Docker Compose for local development orchestration

- REST API yang ditulis dengan Go menggunakan Gin
- PostgreSQL untuk penyimpanan data transaksional
- Redis untuk caching
- Frontend React + Vite untuk alur kerja POS dan dashboard operasional
- Docker Compose untuk orkestrasi development lokal

## Architecture Overview / Gambaran Arsitektur

### Backend

The backend follows a Hexagonal Architecture approach to keep domain logic separated from transport and storage concerns.

Backend mengikuti pendekatan Hexagonal Architecture agar logika domain tetap terpisah dari concern transport dan penyimpanan.

Main backend technologies:

Teknologi utama backend:

- [Go](https://go.dev/)
- [Gin](https://gin-gonic.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [pgx](https://github.com/jackc/pgx)
- [Squirrel](https://github.com/Masterminds/squirrel)
- [Redis](https://redis.io/)
- [go-redis](https://github.com/redis/go-redis)

### Frontend

The frontend lives in [`web/`](./web) and provides the operator-facing UI.

Frontend berada di [`web/`](./web) dan menyediakan antarmuka untuk operator.

Main frontend technologies:

Teknologi utama frontend:

- [React](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

Current UI modules include:

Modul UI yang tersedia saat ini:

- Authentication: login and registration
- Dashboard: high-level operational summary
- POS: create transactions from the cashier interface
- Products: product catalog management
- Orders: transaction history
- Customers: customer management
- Inventory: stock visibility
- Reports: daily sales, weekly cashflow, and monthly product analysis
- Settings: application-level preferences UI

- Authentication: login dan registrasi
- Dashboard: ringkasan operasional tingkat tinggi
- POS: membuat transaksi dari antarmuka kasir
- Products: manajemen katalog produk
- Orders: riwayat transaksi
- Customers: manajemen pelanggan
- Inventory: visibilitas stok
- Reports: penjualan harian, cashflow mingguan, dan analisis produk bulanan
- Settings: UI untuk preferensi aplikasi

Recent additions:

Penambahan terbaru:

- Backend store chat MVP for customer-admin conversations using REST + polling
- Frontend admin inbox and storefront chat pages
- Role-aware access for admin-only chat inbox
- Frontend lazy-loading for heavier routes to reduce initial bundle size

- Backend chat store MVP untuk percakapan customer-admin berbasis REST + polling
- Halaman frontend inbox admin dan chat storefront
- Akses berbasis role untuk inbox chat khusus admin
- Lazy-loading frontend untuk route yang lebih berat agar bundle awal lebih ringan

## Project Structure / Struktur Proyek

```text
.
├── cmd/                          # Application entrypoints / entrypoint aplikasi
├── internal/                     # Domain, use cases, adapters, and infrastructure / domain, use case, adapter, dan infrastruktur
├── docs/                         # Generated Swagger docs / dokumentasi Swagger hasil generate
├── web/                          # Frontend application (React + Vite)
├── docker-compose.yml            # Local service orchestration / orkestrasi service lokal
├── Taskfile.yml                  # Common development tasks / task development umum
└── .env.example                  # Local environment reference / referensi environment lokal
```

## Getting Started / Memulai

### Prerequisites / Prasyarat

If you are not using a devcontainer, make sure you have:

Jika Anda tidak menggunakan devcontainer, pastikan tersedia:

- [Go](https://go.dev/dl/) 1.23 or higher
- [Task](https://taskfile.dev/installation/)
- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) 20+ if you want to run the frontend outside Docker

- [Go](https://go.dev/dl/) 1.23 atau lebih baru
- [Task](https://taskfile.dev/installation/)
- [Docker](https://www.docker.com/) dan Docker Compose
- [Node.js](https://nodejs.org/) 20+ jika ingin menjalankan frontend di luar Docker

You can verify the main tools with:

Anda bisa memverifikasi tools utama dengan:

```bash
go version
task --version
docker --version
node --version
```

### Environment Setup / Setup Environment

Create a copy of the example environment file:

Buat salinan file environment contoh:

```bash
cp .env.example .env
```

Important variables:

Variabel penting:

- `APP_HOST_PORT`: host port for the production-style backend container
- `APP_DEV_HOST_PORT`: host port for the development backend container
- `WEB_HOST_PORT`: host port for the Vite frontend
- `TOKEN_KEY_HEX`: 32-byte hex string for stable token signing

- `APP_HOST_PORT`: port host untuk container backend bergaya production
- `APP_DEV_HOST_PORT`: port host untuk container backend development
- `WEB_HOST_PORT`: port host untuk frontend Vite
- `TOKEN_KEY_HEX`: string hex 32-byte untuk penandatanganan token yang stabil

Generate a secure token key with:

Buat token key yang aman dengan:

```bash
openssl rand -hex 32
```

### Start the Full Stack with Docker / Menjalankan Full Stack dengan Docker

This is the simplest way to run backend, frontend, PostgreSQL, and Redis together.

Ini adalah cara paling sederhana untuk menjalankan backend, frontend, PostgreSQL, dan Redis secara bersamaan.

1. Install Go-side tooling:

Instal tooling sisi Go:

```bash
task install
```

2. Start supporting services:

Jalankan service pendukung:

```bash
task service:up
```

3. Create the database if needed:

Buat database jika belum ada:

```bash
task db:create
```

4. Run migrations:

Jalankan migrasi:

```bash
task migrate:up
```

After the containers are up, the app is typically available at:

Setelah container berjalan, aplikasi biasanya tersedia di:

- Frontend: `http://localhost:5175`
- Backend API (dev): `http://localhost:8082`
- Backend API (app container): `http://localhost:8083`
- Swagger docs: `http://localhost:8082/docs/index.html`

## Local Development / Development Lokal

### Backend Only / Backend Saja

Run the Go API with live reload:

Jalankan API Go dengan live reload:

```bash
task dev
```

This uses `air` and starts the backend on `http://127.0.0.1:8082` when running in the provided Docker setup.

Perintah ini menggunakan `air` dan menjalankan backend di `http://127.0.0.1:8082` saat memakai setup Docker yang tersedia di repo ini.

### Frontend Only / Frontend Saja

If you want to run the frontend directly on your machine instead of through Docker:

Jika ingin menjalankan frontend langsung di mesin lokal tanpa Docker:

```bash
cd web
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

By default, the frontend reads its API base URL from `VITE_API_BASE`.

Secara default, frontend membaca base URL API dari `VITE_API_BASE`.

- Default fallback: `http://127.0.0.1:8082/v1`
- In Docker Compose: `VITE_API_BASE` is set to `/v1` and proxied by Vite

- Fallback default: `http://127.0.0.1:8082/v1`
- Di Docker Compose: `VITE_API_BASE` di-set ke `/v1` dan diproxy oleh Vite

For local non-Docker frontend development, you can create `web/.env.local`:

Untuk development frontend lokal tanpa Docker, Anda bisa membuat `web/.env.local`:

```bash
VITE_API_BASE=http://127.0.0.1:8082/v1
```

### Frontend Dev Proxy

The Vite config proxies `/v1` requests to the backend target defined by `VITE_PROXY_TARGET`.

Konfigurasi Vite mem-proxy request `/v1` ke target backend yang ditentukan oleh `VITE_PROXY_TARGET`.

Default proxy target in Docker Compose:

Default target proxy di Docker Compose:

```bash
http://app:8082
```

This keeps frontend API calls simple and avoids hardcoding internal container hostnames in the app code.

Pendekatan ini membuat pemanggilan API dari frontend tetap sederhana dan menghindari hardcode hostname internal container di kode aplikasi.

## Available Tasks / Task yang Tersedia

Common `task` commands:

Perintah `task` yang umum:

- `task install`: install development dependencies and CLI tools
- `task service:up`: start PostgreSQL and Redis containers
- `task service:down`: stop running containers
- `task db:create`: create the database
- `task db:cli`: open a PostgreSQL shell
- `task migrate:up`: run database migrations
- `task migrate:down`: rollback migrations
- `task redis:cli`: open a Redis shell
- `task dev`: run backend in development mode
- `task lint`: run the Go linter
- `task test`: run backend tests with race detection and coverage
- `task swag`: regenerate Swagger documentation

- `task install`: instal dependency development dan CLI tools
- `task service:up`: menjalankan container PostgreSQL dan Redis
- `task service:down`: menghentikan container yang berjalan
- `task db:create`: membuat database
- `task db:cli`: membuka shell PostgreSQL
- `task migrate:up`: menjalankan migrasi database
- `task migrate:down`: rollback migrasi
- `task redis:cli`: membuka shell Redis
- `task dev`: menjalankan backend dalam mode development
- `task lint`: menjalankan linter Go
- `task test`: menjalankan test backend dengan race detection dan coverage
- `task swag`: generate ulang dokumentasi Swagger

## Frontend Notes / Catatan Frontend

### Frontend Data Flow

The frontend uses `fetch`-based API helpers in [`web/src/lib/api.js`](./web/src/lib/api.js) and authenticates requests with bearer tokens when available.

Frontend menggunakan helper API berbasis `fetch` di [`web/src/lib/api.js`](./web/src/lib/api.js) dan mengautentikasi request dengan bearer token jika tersedia.

This keeps API access centralized and makes it easier to:

Pendekatan ini menjaga akses API tetap terpusat dan memudahkan untuk:

- add request/response normalization
- introduce token refresh handling
- standardize error handling
- migrate to a richer API client later if needed

- menambahkan normalisasi request/response
- menambahkan penanganan refresh token
- menstandarkan error handling
- bermigrasi ke API client yang lebih kaya bila diperlukan

### Routing

Main application routes are defined in [`web/src/App.jsx`](./web/src/App.jsx). Protected pages are wrapped by the authenticated layout, while login and registration remain public.

Route utama aplikasi didefinisikan di [`web/src/App.jsx`](./web/src/App.jsx). Halaman yang dilindungi dibungkus oleh layout terautentikasi, sedangkan login dan registrasi tetap publik.

### Forward-Looking Frontend Improvements / Arah Pengembangan Frontend

Useful next steps for frontend development:

Langkah lanjutan yang berguna untuk pengembangan frontend:

- add automated tests for key pages and API flows
- introduce stronger form validation and reusable field components
- improve loading, empty, and error states consistently across screens
- formalize design tokens for spacing, color, and typography
- add role-aware UI permissions for admin and cashier scenarios
- support export/print workflows with clearer reporting UX
- split large page components into smaller feature modules as complexity grows
- add API schema typing or shared contracts between frontend and backend

- menambahkan automated test untuk halaman utama dan alur API
- menambahkan validasi form yang lebih kuat dan komponen field yang reusable
- merapikan state loading, empty, dan error secara konsisten di seluruh layar
- meresmikan design token untuk spacing, warna, dan tipografi
- menambahkan permission UI berbasis role untuk skenario admin dan kasir
- mendukung alur export/print dengan UX laporan yang lebih jelas
- memecah page component besar menjadi modul fitur yang lebih kecil saat kompleksitas bertambah
- menambahkan typing schema API atau shared contract antara frontend dan backend

## Documentation / Dokumentasi

Database schema documentation:

Dokumentasi schema database:

- [dbdocs.io](https://dbdocs.io/bagashiz/Go-POS/)

API documentation:

Dokumentasi API:

- Generated files live in [`docs/`](./docs)
- Open Swagger UI at `http://localhost:8082/docs/index.html`

- File hasil generate ada di [`docs/`](./docs)
- Buka Swagger UI di `http://localhost:8082/docs/index.html`

## Contributing / Kontribusi

Developers interested in contributing to Go POS can refer to [CONTRIBUTING.md](./CONTRIBUTING.md).

Developer yang ingin berkontribusi ke Go POS dapat melihat [CONTRIBUTING.md](./CONTRIBUTING.md).

## Maintainer / Pengembang Lanjutan

This repository includes original work by Bagas Hizbullah and continued development, maintenance, and feature additions by Gunanto.

Repositori ini mencakup karya asli dari Bagas Hizbullah dan pengembangan lanjutan, pemeliharaan, serta penambahan fitur oleh Gunanto.

- Maintainer / Pengembang lanjutan: Gunanto
- Contact / Kontak: `gunanto75@gmail.com`

## License / Lisensi

This project is licensed under the [MIT License](./LICENSE).

Proyek ini dilisensikan di bawah [MIT License](./LICENSE).

MIT is a permissive license. You can modify the codebase and its documentation, including this README, as long as you continue complying with the license terms when redistributing the software.

MIT adalah lisensi permisif. Anda dapat memodifikasi codebase dan dokumentasinya, termasuk README ini, selama tetap mematuhi ketentuan lisensi saat mendistribusikan ulang software.

### MIT Usage Reminder / Pengingat Penggunaan MIT

You may add new backend or frontend features, modify existing code, and redistribute the software under the MIT License, provided that:

Anda boleh menambahkan fitur backend atau frontend baru, memodifikasi kode yang ada, dan mendistribusikan ulang software ini di bawah lisensi MIT, dengan syarat:

- the original MIT license text remains included in redistributed copies or substantial portions of the software
- copyright and license notices are preserved
- attribution to prior authors is not removed when substantial portions of their work remain
- usage must still comply with applicable laws and regulations in your jurisdiction
- this project is provided "as is", without warranty, as stated in the MIT License

- teks lisensi MIT tetap disertakan dalam salinan distribusi atau bagian substansial software
- notice copyright dan lisensi tetap dipertahankan
- atribusi kepada penulis sebelumnya tidak dihapus selama bagian substansial karyanya masih ada
- penggunaan tetap harus mematuhi hukum dan peraturan yang berlaku di yurisdiksi Anda
- proyek ini disediakan apa adanya tanpa jaminan sebagaimana tercantum dalam lisensi MIT

For attribution and maintenance context, see [NOTICE](./NOTICE).

Untuk konteks atribusi dan pemeliharaan, lihat [NOTICE](./NOTICE).
- pemberitahuan hak cipta dan lisensi tetap dipertahankan
- penggunaan tetap harus mematuhi hukum dan regulasi yang berlaku di yurisdiksi Anda
- proyek ini disediakan "as is" tanpa jaminan, sesuai isi lisensi MIT

## Learning References / Referensi Pembelajaran

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/) by Alistair Cockburn
- [Ready for changes with Hexagonal Architecture](https://netflixtechblog.com/ready-for-changes-with-hexagonal-architecture-b315ec967749) by Netflix Technology Blog
- [Hexagonal Architecture in Go](https://medium.com/@matiasvarela/hexagonal-architecture-in-go-cfd4e436faa3) by Matias Varela
