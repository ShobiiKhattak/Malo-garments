# Malo Garments Backend

This is the backend API for the Malo Garments store. It provides product, category, auth, order, newsletter, and admin functionality using Node.js, Express, TypeScript, and MySQL with Prisma.

## Requirements

- Node.js 18+
- MySQL server
- Prisma-compatible MySQL database

## Setup

```bash
cd backend
npm install
```

Create a `.env` file with your local database and app config.

```bash
cp .env.example .env
```

Example values:

```env
DATABASE_URL="mysql://root@127.0.0.1:3306/malo_garments"
PORT=3001
JWT_SECRET=your_jwt_secret
ADMIN_JWT_SECRET=your_admin_jwt_secret
```

## Database

Create the database and tables:

```bash
mysql -u root -p < db/schema.sql
```

Optional demo data:

```bash
npm run seed
```

## Run

For development (TypeScript runs directly via `tsx`, auto-restarts on change):

```bash
npm run dev
```

For production, compile TypeScript to `dist/` first, then start:

```bash
npm run build
npm start
```

The API is available at:

```text
http://localhost:3001
```

Health check:

```text
http://localhost:3001/api/health
```

## API overview

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)
- `GET /api/categories`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `POST /api/auth/me/addresses`
- `POST /api/orders`
- `GET /api/orders/mine`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status` (admin)
- `POST /api/admin/login`
- `GET /api/admin/stats`
- `GET /api/admin/customers`
- `POST /api/newsletter`

## Notes

- The frontend uses the backend API for real database-backed data.
- Cart state remains in the browser localStorage until checkout.
- Email sending is enabled through Gmail SMTP when `EMAIL_USER` and `EMAIL_PASS` are configured.
