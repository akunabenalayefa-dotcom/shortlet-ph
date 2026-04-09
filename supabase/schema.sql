-- ═══════════════════════════════════════════════════════════════
-- ShortLet PH — Full Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- ── Enable UUID extension ─────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── VENDORS (host profiles) ───────────────────────────────────
create table if not exists public.vendors (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text not null,
  phone         text,
  avatar_url    text,
  bio           text,
  bank_name     text,
  bank_account  text,
  account_name  text,
  is_verified   boolean default false,
  status        text default 'pending' check (status in ('pending','active','suspended')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── PROPERTIES ────────────────────────────────────────────────
create table if not exists public.properties (
  id            uuid primary key default uuid_generate_v4(),
  vendor_id     uuid references public.vendors(id) on delete cascade not null,
  title         text not null,
  description   text,
  area          text not null,
  address       text,
  type          text not null,
  beds          int default 1,
  baths         int default 1,
  max_guests    int default 2,
  price_per_night bigint not null,
  photos        text[] default '{}',
  amenities     text[] default '{}',
  status        text default 'pending' check (status in ('pending','approved','rejected','suspended')),
  admin_notes   text,
  rating        numeric(3,2) default 0,
  total_reviews int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── PROPERTY AVAILABILITY (blocked dates) ────────────────────
create table if not exists public.availability (
  id            uuid primary key default uuid_generate_v4(),
  property_id   uuid references public.properties(id) on delete cascade not null,
  blocked_date  date not null,
  reason        text default 'blocked',
  created_at    timestamptz default now(),
  unique(property_id, blocked_date)
);

-- ── GUESTS ───────────────────────────────────────────────────
create table if not exists public.guests (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text not null,
  phone         text,
  avatar_url    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── BOOKINGS ─────────────────────────────────────────────────
create table if not exists public.bookings (
  id            uuid primary key default uuid_generate_v4(),
  reference     text unique not null,
  property_id   uuid references public.properties(id) on delete restrict not null,
  guest_id      uuid references public.guests(id) on delete restrict not null,
  vendor_id     uuid references public.vendors(id) on delete restrict not null,
  checkin_date  date not null,
  checkout_date date not null,
  nights        int not null,
  guests_count  int not null default 1,
  price_per_night bigint not null,
  subtotal      bigint not null,
  service_fee   bigint not null,
  total         bigint not null,
  status        text default 'upcoming' check (status in ('upcoming','active','completed','cancelled')),
  payment_status text default 'pending' check (payment_status in ('pending','paid','refunded')),
  paystack_ref  text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── MESSAGES ─────────────────────────────────────────────────
create table if not exists public.messages (
  id            uuid primary key default uuid_generate_v4(),
  booking_id    uuid references public.bookings(id) on delete cascade,
  property_id   uuid references public.properties(id) on delete cascade,
  sender_id     uuid references auth.users(id) on delete cascade not null,
  recipient_id  uuid references auth.users(id) on delete cascade not null,
  body          text not null,
  is_read       boolean default false,
  created_at    timestamptz default now()
);

-- ── REVIEWS ──────────────────────────────────────────────────
create table if not exists public.reviews (
  id            uuid primary key default uuid_generate_v4(),
  booking_id    uuid references public.bookings(id) on delete cascade unique,
  property_id   uuid references public.properties(id) on delete cascade not null,
  guest_id      uuid references public.guests(id) on delete cascade not null,
  rating        int not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz default now()
);

-- ── SAVED LISTINGS ────────────────────────────────────────────
create table if not exists public.saved_listings (
  id            uuid primary key default uuid_generate_v4(),
  guest_id      uuid references public.guests(id) on delete cascade not null,
  property_id   uuid references public.properties(id) on delete cascade not null,
  created_at    timestamptz default now(),
  unique(guest_id, property_id)
);

-- ── PAYOUTS ──────────────────────────────────────────────────
create table if not exists public.payouts (
  id            uuid primary key default uuid_generate_v4(),
  vendor_id     uuid references public.vendors(id) on delete cascade not null,
  booking_id    uuid references public.bookings(id) on delete cascade not null,
  amount        bigint not null,
  platform_fee  bigint not null,
  net_amount    bigint not null,
  status        text default 'pending' check (status in ('pending','processing','paid','failed')),
  paid_at       timestamptz,
  created_at    timestamptz default now()
);

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

alter table public.vendors       enable row level security;
alter table public.properties    enable row level security;
alter table public.availability  enable row level security;
alter table public.guests        enable row level security;
alter table public.bookings      enable row level security;
alter table public.messages      enable row level security;
alter table public.reviews       enable row level security;
alter table public.saved_listings enable row level security;
alter table public.payouts       enable row level security;

-- VENDORS policies
create policy "Vendors can view own profile"
  on public.vendors for select using (auth.uid() = id);
create policy "Vendors can update own profile"
  on public.vendors for update using (auth.uid() = id);
create policy "Vendors can insert own profile"
  on public.vendors for insert with check (auth.uid() = id);

-- PROPERTIES policies
create policy "Anyone can view approved properties"
  on public.properties for select using (status = 'approved');
create policy "Vendors can view own properties"
  on public.properties for select using (auth.uid() = vendor_id);
create policy "Vendors can insert own properties"
  on public.properties for insert with check (auth.uid() = vendor_id);
create policy "Vendors can update own properties"
  on public.properties for update using (auth.uid() = vendor_id);

-- AVAILABILITY policies
create policy "Anyone can view availability"
  on public.availability for select using (true);
create policy "Vendors can manage their property availability"
  on public.availability for all using (
    exists (
      select 1 from public.properties p
      where p.id = availability.property_id and p.vendor_id = auth.uid()
    )
  );

-- GUESTS policies
create policy "Guests can view own profile"
  on public.guests for select using (auth.uid() = id);
create policy "Guests can update own profile"
  on public.guests for update using (auth.uid() = id);
create policy "Guests can insert own profile"
  on public.guests for insert with check (auth.uid() = id);

-- BOOKINGS policies
create policy "Guests can view own bookings"
  on public.bookings for select using (auth.uid() = guest_id);
create policy "Vendors can view bookings for their properties"
  on public.bookings for select using (auth.uid() = vendor_id);
create policy "Guests can create bookings"
  on public.bookings for insert with check (auth.uid() = guest_id);
create policy "Vendors can update booking status"
  on public.bookings for update using (auth.uid() = vendor_id);

-- MESSAGES policies
create policy "Users can view their messages"
  on public.messages for select using (
    auth.uid() = sender_id or auth.uid() = recipient_id
  );
create policy "Users can send messages"
  on public.messages for insert with check (auth.uid() = sender_id);
create policy "Recipients can mark as read"
  on public.messages for update using (auth.uid() = recipient_id);

-- REVIEWS policies
create policy "Anyone can view reviews"
  on public.reviews for select using (true);
create policy "Guests can insert reviews for their bookings"
  on public.reviews for insert with check (auth.uid() = guest_id);

-- SAVED LISTINGS policies
create policy "Guests can manage their saved listings"
  on public.saved_listings for all using (auth.uid() = guest_id);

-- PAYOUTS policies
create policy "Vendors can view own payouts"
  on public.payouts for select using (auth.uid() = vendor_id);

-- ══════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ══════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_vendors_updated
  before update on public.vendors
  for each row execute procedure public.handle_updated_at();

create trigger on_properties_updated
  before update on public.properties
  for each row execute procedure public.handle_updated_at();

create trigger on_bookings_updated
  before update on public.bookings
  for each row execute procedure public.handle_updated_at();

-- Auto-generate booking reference
create or replace function public.generate_booking_ref()
returns trigger language plpgsql as $$
begin
  new.reference = 'PH-' || extract(year from now())::text || '-' ||
    lpad((floor(random() * 9000) + 1000)::text, 4, '0');
  return new;
end;
$$;

create trigger on_booking_created
  before insert on public.bookings
  for each row execute procedure public.generate_booking_ref();

-- Auto-create payout when booking completed
create or replace function public.create_payout_on_complete()
returns trigger language plpgsql as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    insert into public.payouts (vendor_id, booking_id, amount, platform_fee, net_amount)
    values (
      new.vendor_id,
      new.id,
      new.subtotal,
      round(new.subtotal * 0.1),
      round(new.subtotal * 0.9)
    );
  end if;
  return new;
end;
$$;

create trigger on_booking_completed
  after update on public.bookings
  for each row execute procedure public.create_payout_on_complete();

-- Update property rating when review added
create or replace function public.update_property_rating()
returns trigger language plpgsql as $$
begin
  update public.properties
  set
    rating = (select avg(rating) from public.reviews where property_id = new.property_id),
    total_reviews = (select count(*) from public.reviews where property_id = new.property_id)
  where id = new.property_id;
  return new;
end;
$$;

create trigger on_review_added
  after insert on public.reviews
  for each row execute procedure public.update_property_rating();

-- ══════════════════════════════════════════════════════════════
-- STORAGE BUCKET
-- ══════════════════════════════════════════════════════════════
-- NOTE: Also create this manually in Supabase Dashboard:
-- Storage → New bucket → Name: "property-photos" → Public: YES

insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict do nothing;

create policy "Anyone can view property photos"
  on storage.objects for select using (bucket_id = 'property-photos');

create policy "Vendors can upload property photos"
  on storage.objects for insert with check (
    bucket_id = 'property-photos' and auth.role() = 'authenticated'
  );

create policy "Vendors can delete own photos"
  on storage.objects for delete using (
    bucket_id = 'property-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ══════════════════════════════════════════════════════════════
-- SEED: Sample approved property (optional, for testing)
-- ══════════════════════════════════════════════════════════════
-- You can uncomment and run this after creating a vendor account:
-- insert into public.properties (vendor_id, title, description, area, type, beds, baths, max_guests, price_per_night, amenities, status)
-- values ('<your-vendor-uuid>', 'GRA Executive Studio', 'A beautifully furnished studio in New GRA.', 'New GRA', 'Studio', 1, 1, 2, 110000, ARRAY['WiFi','24/7 Power','AC','Parking'], 'approved');
