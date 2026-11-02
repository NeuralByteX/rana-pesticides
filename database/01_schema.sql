-- Rana Pesticides: database schema for Supabase (run once in SQL Editor)
-- Key rule: wholesale prices live in their own table that only approved wholesalers and admins can read.

-- ---------- People ----------
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.wholesalers (
  id uuid primary key references auth.users(id) on delete cascade,
  shop_name text not null,
  owner_name text not null,
  phone text not null,
  city text,
  gst_no text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.wholesalers where id = auth.uid() and status = 'approved') $$;

-- ---------- Catalogue ----------
create table public.categories (
  id bigint generated always as identity primary key,
  name_en text not null,
  name_hi text not null,
  sort int not null default 0
);

create table public.products (
  id bigint generated always as identity primary key,
  category_id bigint references public.categories(id),
  brand text,
  name_en text not null,
  name_hi text,
  image_path text,            -- file name inside the product-images bucket
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.pack_sizes (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  label text not null,        -- e.g. "50 kg", "250 ml"
  mrp numeric(10,2) not null,
  retail_price numeric(10,2) not null,
  in_stock boolean not null default true
);

-- Wholesale prices are SEPARATE so farmers can never read them.
create table public.wholesale_prices (
  pack_id bigint primary key references public.pack_sizes(id) on delete cascade,
  price numeric(10,2) not null
);

create table public.shop_settings (
  id int primary key default 1 check (id = 1),
  address text, phone text, whatsapp text, email text, hours text
);

-- ---------- Orders ----------
create table public.orders (
  id bigint generated always as identity primary key,
  wholesaler_id uuid not null references public.wholesalers(id),
  status text not null default 'new' check (status in ('new','confirmed','delivered','cancelled')),
  note text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  pack_id bigint not null references public.pack_sizes(id),
  qty int not null check (qty > 0),
  unit_price numeric(10,2) not null     -- price at the time of the order
);

-- ---------- Row-level security ----------
alter table public.admins            enable row level security;
alter table public.wholesalers       enable row level security;
alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.pack_sizes        enable row level security;
alter table public.wholesale_prices  enable row level security;
alter table public.shop_settings     enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;

-- admins table: nobody can read it through the API (is_admin() reads it internally)

-- wholesalers: sign up as pending, read own row; admin reads/approves everyone
create policy "wholesaler registers" on public.wholesalers for insert to authenticated
  with check (id = auth.uid() and status = 'pending');
create policy "wholesaler reads self" on public.wholesalers for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "admin updates wholesalers" on public.wholesalers for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- public catalogue: everyone can read, only admin can change
create policy "public reads categories" on public.categories for select using (true);
create policy "admin manages categories" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "public reads active products" on public.products for select
  using (active or public.is_admin());
create policy "admin manages products" on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "public reads packs" on public.pack_sizes for select using (true);
create policy "admin manages packs" on public.pack_sizes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "public reads settings" on public.shop_settings for select using (true);
create policy "admin manages settings" on public.shop_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- wholesale prices: ONLY approved wholesalers and admin
create policy "approved reads wholesale prices" on public.wholesale_prices for select to authenticated
  using (public.is_approved() or public.is_admin());
create policy "admin manages wholesale prices" on public.wholesale_prices for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- orders: wholesaler sees own, admin sees all and updates status. Inserts only via place_order().
create policy "read own orders" on public.orders for select to authenticated
  using (wholesaler_id = auth.uid() or public.is_admin());
create policy "admin updates orders" on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "read own order items" on public.order_items for select to authenticated
  using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.wholesaler_id = auth.uid()));

-- ---------- Place an order (prices are taken from the server, never from the browser) ----------
create or replace function public.place_order(items jsonb, note text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare oid bigint; it jsonb; pr numeric; q int;
begin
  if not public.is_approved() then raise exception 'Account not approved'; end if;
  if items is null or jsonb_array_length(items) = 0 then raise exception 'Empty order'; end if;
  insert into public.orders (wholesaler_id, note) values (auth.uid(), note) returning id into oid;
  for it in select * from jsonb_array_elements(items) loop
    q := (it->>'qty')::int;
    if q is null or q < 1 or q > 10000 then raise exception 'Bad quantity'; end if;
    select w.price into pr
      from public.wholesale_prices w join public.pack_sizes p on p.id = w.pack_id
      where w.pack_id = (it->>'pack_id')::bigint and p.in_stock;
    if pr is null then raise exception 'Item unavailable'; end if;
    insert into public.order_items (order_id, pack_id, qty, unit_price)
      values (oid, (it->>'pack_id')::bigint, q, pr);
  end loop;
  return oid;
end $$;
revoke all on function public.place_order(jsonb, text) from public, anon;
grant execute on function public.place_order(jsonb, text) to authenticated;

-- ---------- Product photos (storage) ----------
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
  on conflict (id) do nothing;
create policy "public reads product images" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "admin writes product images" on storage.objects for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- ---------- Starter data ----------
insert into public.categories (name_en, name_hi, sort) values
  ('Fertilizers','उर्वरक',1), ('Growth Boosters','ग्रोथ बूस्टर',2), ('Fungicides','फफूंदनाशक',3),
  ('Crop Protection','फसल सुरक्षा',4), ('Seeds','बीज',5), ('Farm Tools','कृषि उपकरण',6);
insert into public.shop_settings (id, address, phone, whatsapp, email, hours) values
  (1, 'Your shop address here', '+91 00000 00000', '910000000000', 'shop@example.com', 'Mon–Sat 8 AM – 7 PM');

-- ---------- After you register your own account in the site, make yourself admin: ----------
-- insert into public.admins (user_id) select id from auth.users where email = 'YOUR-EMAIL-HERE';
