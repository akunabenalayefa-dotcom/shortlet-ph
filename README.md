# ShortLet PH — Full Stack App v2.0 🏙️

**Complete short-let booking platform for Port Harcourt, Nigeria.**
Guest app + Vendor Portal + Supabase + Cloudinary — all in one.

---

## 📁 Project Structure

```
shortlet-ph/
├── index.html
├── vite.config.js
├── package.json
├── .env.example          ← Copy to .env and fill in keys
├── .gitignore
├── README.md
├── supabase/
│   └── schema.sql        ← Run this ONCE in Supabase SQL Editor
└── src/
    ├── main.jsx
    ├── App.jsx            ← Root router (guest/vendor/auth)
    ├── index.css
    ├── lib/
    │   ├── supabase.js    ← Supabase client
    │   ├── cloudinary.js  ← Cloudinary upload helper
    │   ├── api.js         ← All database calls
    │   └── AuthContext.jsx← Global auth state
    ├── components/
    │   └── UI.jsx         ← Toast, Spinner, Buttons, Inputs, etc.
    └── screens/
        ├── AuthScreens.jsx  ← Guest + Vendor login/register
        ├── GuestScreens.jsx ← Home, Explore, Detail, Bookings, Profile
        └── VendorPortal.jsx ← Full host dashboard
```

---

## 🚀 Setup (Do This Once)

### Step 1 — Install Node.js
Download from https://nodejs.org (v18 or higher)

### Step 2 — Set up Supabase
1. Go to https://supabase.com and open your project
2. Click **SQL Editor** in the left sidebar
3. Paste the entire contents of `supabase/schema.sql`
4. Click **Run** — all tables, policies and triggers will be created

### Step 3 — Set up Cloudinary
1. Go to https://cloudinary.com → Dashboard → Settings → Upload
2. Scroll to **Upload Presets** → Click **Add upload preset**
3. Set:
   - **Preset name:** `shortlet_ph_uploads`
   - **Signing mode:** `Unsigned`
   - **Folder:** `shortlet-ph`
4. Save the preset

### Step 4 — Configure environment variables
```bash
cp .env.example .env
```
Then open `.env` and fill in:

```env
VITE_SUPABASE_URL=https://rdmewysroptfsnttxgzl.supabase.co
VITE_SUPABASE_ANON_KEY=<get from Supabase → Settings → API → anon public>

VITE_CLOUDINARY_CLOUD_NAME=dtsk51yo2
VITE_CLOUDINARY_UPLOAD_PRESET=shortlet_ph_uploads
```

### Step 5 — Install & run
```bash
npm install
npm run dev
```
Open **http://localhost:5173**

---

## 🌐 Deploy to Vercel

```bash
# Option A: Push to GitHub then import on vercel.com
# Option B: Vercel CLI
npm install -g vercel
vercel
```

**Add environment variables in Vercel:**
Vercel Dashboard → Project → Settings → Environment Variables
Add all 4 variables from your `.env` file.

---

## ✨ Features

### Guest App (Mobile)
- Browse approved listings with real photos
- Search by area, sort by price/rating
- Full listing detail with photo gallery
- Booking flow with date picker, price calculator
- Booking history
- Save/favourite listings (persisted to DB)
- Guest registration + login + password reset

### Vendor Portal (Desktop)
- **Dashboard** — Stats, upcoming bookings, quick actions
- **Properties** — List, edit, manage listings with real photo uploads via Cloudinary
- **Bookings** — View all bookings, check-in guests, mark complete
- **Earnings** — Payout history, net earnings (90% after 10% platform fee)
- **Messages** — Real-time guest messaging (Supabase realtime)
- **Availability** — Block/unblock dates calendar
- **Settings** — Edit profile, bank account details
- Vendor registration (2-step with bank details)
- Admin approval flow (listings start as "pending")

### Database
- Full Row Level Security (RLS) — data properly isolated
- Auto booking reference generation (`PH-2026-XXXX`)
- Auto payout creation on booking completion
- Property rating auto-update on new review

---

## 🗃️ Database Tables

| Table | Purpose |
|---|---|
| `vendors` | Host profiles (linked to Supabase auth) |
| `guests` | Guest profiles (linked to Supabase auth) |
| `properties` | Listings with photos array (Cloudinary URLs) |
| `availability` | Blocked dates per property |
| `bookings` | All reservations |
| `messages` | Guest ↔ Host messaging |
| `reviews` | Ratings + comments |
| `saved_listings` | Guest favourites |
| `payouts` | Vendor payout records |

---

## 🔑 How Auth Works

- Users sign up via Supabase Auth (email + password)
- `role` is stored in `user_metadata` (`guest` or `vendor`)
- On login, the app reads the role and routes to:
  - Guest → Mobile app
  - Vendor → Desktop portal
- Row Level Security ensures users only see their own data

---

## 🛠️ Next Steps for Production

1. **Paystack** — Integrate real payment processing
2. **Email notifications** — Supabase edge functions + Resend
3. **Push notifications** — Firebase Cloud Messaging
4. **Admin dashboard** — Approve/reject vendor listings
5. **Real SMS** — OTP verification via Termii or Twilio
6. **Mobile app** — Wrap in React Native / Capacitor

---

## 🎨 Design Tokens

| Token | Value |
|---|---|
| Gold | `#C9A84C` |
| App BG | `#080814` |
| Card | `#0f0f1a` |
| Portal BG | `#faf8f5` |
| Portal Sidebar | `#1a1209` |
| Font Display | Playfair Display |
| Font Body | DM Sans |

---

Built for **ShortLet PH** · Port Harcourt, Nigeria 🇳🇬  
v2.0 · React + Vite + Supabase + Cloudinary
