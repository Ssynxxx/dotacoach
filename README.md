# Dota Coach AI

Aplikasi full stack untuk menganalisis match Dota 2 dengan AI. User login dengan Google, menyimpan Dota ID, lalu data match
diambil dari **OpenDota API** dan dianalisis oleh **Gemini** (3rd party API pertama, AI). Semua panggilan ke OpenDota dan Gemini
dilakukan lewat server sehingga API key tetap aman.

## Fitur
| Fitur | Keterangan |
|---|---|
| Login Google | Google Identity Services di client, token diverifikasi di server, lalu server menerbitkan JWT |
| Dashboard | Rank, win/loss, win rate, 5 hero paling sering dimainkan |
| Analisis match | Pilih match terbaru, AI menjelaskan performa (GPM/XPM, KDA, item) dan memberi saran |
| Draft coach | Pilih hero tim dan lawan, AI merekomendasikan pick beserta alasannya |
| Tanya coach | Chatbot dengan konteks statistik pemain |
| Hero | Daftar, pencarian, filter atribut/role, favorit |
| CRUD | Favorites, Notes, Saved analyses (semua per user) |

## Pemenuhan requirement
- Client-server: `server/` (Express REST API) dan `client/` (Vite + React)
- Redux sebagai single source of truth: semua fetch lewat thunk di `client/src/store`
- Social login Google, 3rd party API: Gemini (AI) dan OpenDota
- CRUD, middleware (`authenticate`, `errorHandler`), testing Jest dengan coverage threshold 90%

## Menjalankan
Prasyarat: Node 18+, PostgreSQL, Google OAuth Client ID, Gemini API key.

```bash
# Server
cd server
cp .env.example .env      # isi DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID, GEMINI_API_KEY
npm install
npm run dev               # http://localhost:3000 (tabel dibuat otomatis lewat sequelize.sync)

# Client (terminal lain)
cd client
cp .env.example .env      # isi VITE_GOOGLE_CLIENT_ID (sama dengan di server)
npm install
npm run dev               # http://localhost:5173
```

Google Client ID: Google Cloud Console, APIs & Services, Credentials, **OAuth client ID** tipe *Web application*.
Tambahkan `http://localhost:5173` ke *Authorized JavaScript origins* (dan URL deploy nanti).
Gemini API key: https://aistudio.google.com/apikey. Nama model bisa diganti lewat `GEMINI_MODEL` jika model default sudah tidak tersedia.

## Testing
```bash
cd server && npm test     # Jest + Supertest, DB SQLite in-memory, OpenDota/Gemini/Google di-mock
```
Gagal jika coverage di bawah 90% (statements/lines/functions). Tampilkan laporan coverage saat demo atau review.

## Endpoint (semua kecuali `/auth/google` butuh header `Authorization: Bearer <token>`)
| Method | Path | Fungsi |
|---|---|---|
| POST | `/auth/google` | `{credential}` login Google, balikan `{token, user}` |
| GET / PATCH | `/auth/me` | Profil / simpan `{steamId}` (Dota ID atau Steam64) |
| GET | `/dota/heroes`, `/dota/heroes/:id` | Data hero + win rate publik |
| GET | `/dota/players/:accountId` | Profil, rank, win/loss, top hero |
| GET | `/dota/players/:accountId/recent-matches` | Match terbaru |
| GET | `/dota/matches/:matchId` | Detail match |
| POST | `/ai/match-analysis` | `{matchId}` analisis AI |
| POST | `/ai/draft` | `{allies:[id], enemies:[id], role}` saran draft |
| POST | `/ai/chat` | `{message, history}` tanya coach |
| GET POST | `/favorites`, `/notes`, `/analyses` | List / buat |
| GET PUT DELETE | `/favorites/:id`, `/notes/:id`, `/analyses/:id` | Detail / ubah / hapus (hanya milik sendiri) |

Error selalu berbentuk `{ "message": "..." }` dengan status HTTP yang sesuai (400, 401, 404, 409, 429, 502, 503).

## Struktur data
```
User (id, googleId, email, name, picture, steamId)
 ├─< Favorite (userId, heroId, heroName, note)       unik per (user, hero)
 ├─< Note     (userId, matchId?, title, content)
 └─< Analysis (userId, type: match|draft|chat, title, content, meta JSON)
```

## Git workflow (sesuai aturan challenge)
```bash
# fork repo di GitHub, lalu clone fork kamu
git checkout -b development
git commit -m "feat: add google login endpoint"   # commit kecil dan deskriptif, minimal 4x per hari
git push origin development                       # jangan push langsung ke main
# buka Pull Request development -> main, merge lewat PR
```

## Deploy
- **Server**: Railway / Render dengan PostgreSQL. Set semua variabel di `server/.env.example`, `DB_SSL=true` bila diperlukan, dan `CLIENT_URL` ke URL client.
- **Client**: Vercel / Netlify. Set `VITE_API_URL` ke URL server dan `VITE_GOOGLE_CLIENT_ID`. Untuk React Router, tambahkan rewrite semua path ke `index.html`.
- Tambahkan URL client ke *Authorized JavaScript origins* di Google Cloud Console.

## Skrip demo 5 menit
1. Nama app, latar belakang (pemain sering tidak tahu kenapa kalah), fitur yang ada (1 menit)
2. Login Google, isi Dota ID di Dashboard, tunjukkan statistik
3. Live demo **Analisis match**: pilih match, tunjukkan saran AI, simpan
4. Draft coach: isi 1-2 hero lawan, minta saran pick
5. Cerita tantangan: rate limit OpenDota (solusi: cache hero/item di server), prompt AI agar tidak mengarang statistik

## Catatan
- Pastikan setting **Expose Public Match Data** aktif di Dota 2, kalau tidak OpenDota tidak punya data match kamu.
- Submit ide ke form challenge sebelum mulai, dan konsultasikan fitur utama dengan buddy.
- Match yang belum di-parse OpenDota tetap bisa dianalisis, tapi datanya lebih terbatas.
