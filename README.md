# BNC Apartment — Lodge Management System

Full-stack lodge/BnB management system with **React** frontend + **Neon PostgreSQL** database + **Vercel** serverless API.

---

## 🚀 Setup in 4 Steps

### Step 1 — Create a Neon Database

1. Go to [console.neon.tech](https://console.neon.tech) → **Create Project**
2. Name it `bnc-lodge`, choose the closest region
3. Go to **SQL Editor** and paste the entire contents of `schema.sql` → click **Run**
4. Go to **Connection Details** → copy the **Connection String** (looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)

---

### Step 2 — Push to GitHub

```bash
cd bnc-lodge-full
git init
git add .
git commit -m "Initial commit — BNC Lodge System"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/bnc-lodge.git
git push -u origin main
```

---

### Step 3 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo `bnc-lodge`
3. Under **Environment Variables**, add:
   ```
   DATABASE_URL = postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Click **Deploy** ✅

---

### Step 4 — Done!

Your app is live. Visit the Vercel URL to:
- Browse locations and book rooms as a customer
- Login to the staff dashboard at `/` → **Staff Login**

---

## 🔐 Default Login

After running `schema.sql`, these accounts exist:

| Role | Email | PIN |
|------|-------|-----|
| **Admin** (full access) | admin@bnc.co.tz | 0000 |
| **Manager** (Msasani only) | jane@bnc.co.tz | 1234 |
| **Receptionist** (Stone Town) | peter@bnc.co.tz | 5678 |

> ⚠️ Change PINs after first login via the **Staff** tab.

---

## 💻 Run Locally

```bash
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your DATABASE_URL

npm start       # React frontend on :3000
vercel dev      # Full stack (API + frontend) on :3000
```

---

## 📁 Project Structure

```
bnc-lodge-full/
├── api/                        ← Vercel serverless API functions
│   ├── _db.js                  ← shared Neon client
│   ├── auth/
│   │   └── login.js            ← POST /api/auth/login
│   ├── locations/
│   │   ├── index.js            ← GET /POST /api/locations
│   │   └── [id].js             ← PUT /api/locations/:id
│   ├── rooms/
│   │   ├── index.js            ← GET /POST /api/rooms
│   │   └── [id].js             ← PUT/DELETE /api/rooms/:id
│   ├── bookings/
│   │   ├── index.js            ← GET /POST /api/bookings
│   │   └── [id].js             ← PUT /api/bookings/:id
│   ├── expenses/
│   │   └── index.js            ← GET/POST/DELETE /api/expenses
│   ├── staff/
│   │   ├── index.js            ← GET/POST /api/staff
│   │   └── [id].js             ← PUT /api/staff/:id
│   └── reports/
│       └── summary.js          ← GET /api/reports/summary
├── src/
│   ├── App.jsx                 ← entire React application
│   ├── api.js                  ← all API call helpers
│   └── index.js                ← React entry point
├── public/
│   └── index.html
├── schema.sql                  ← Run this in Neon SQL Editor
├── package.json
├── vercel.json
├── .env.example
└── .gitignore
```

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, inline styles, Google Fonts |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | Neon PostgreSQL (serverless) |
| ORM | `@neondatabase/serverless` (direct SQL) |
| Deploy | Vercel |

---

## ✨ Features

### Customer Portal
- Location picker → room browser → 5-step booking wizard
- Discount support (% or fixed TZS)
- Payment method selection (Cash, Mobile Money, Bank Transfer, Card)
- Live availability from database

### Admin Dashboard
| Tab | Features |
|-----|----------|
| Dashboard | KPIs, revenue, occupancy, recent bookings, per-location summary |
| Bookings | Full lifecycle management, payment recording, search & filter |
| Rooms | Add/edit rooms, amenities, pricing in TZS, status management |
| Payments | Ledger, record partial/full payments, outstanding tracking |
| Expenses | Log by category per location, category analytics |
| Reports | Financial, Occupancy, Location, Expense, Booking analytics |
| Locations | Add/manage lodge locations — Admin only |
| Staff | Create/manage accounts with PIN login, roles — Admin only |

---

Built for **BNC Apartment, Tanzania** 🇹🇿 · Currency: TZS
