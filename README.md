# Rana Pesticides

Bilingual (English / हिंदी) agri-products site. Farmers browse products and retail prices (no online checkout).
Verified wholesalers log in, see wholesale prices and place orders. Admin manages products, prices, wholesalers and orders.

Stack: React + Vite + TypeScript, Tailwind CSS, Supabase (Postgres + Auth + Storage), Vercel.

## 1. Set up the database (Supabase → SQL Editor, run in this order)
1. `database/01_schema.sql` – tables, security rules, `place_order()`, storage bucket, starter categories
2. `database/02_signup_trigger.sql` – creates the pending wholesaler row on sign-up
3. `database/03_seed_products.sql` – optional sample products (placeholder prices)

Authentication → Providers → Email: for testing turn "Confirm email" off; turn it on before going live.

## 2. Run locally
    npm install
    cp .env.example .env     # then fill in your Supabase URL + publishable key
    npm run dev

## 3. Make yourself admin
Register an account on the site (`/register`), then run in the SQL Editor:

    insert into public.admins (user_id) select id from auth.users where email = 'YOUR-EMAIL-HERE';

Log in again; you will land on `/admin`.

## 4. Deploy (Vercel)
Import the GitHub repo, framework preset **Vite**, and add the environment variables
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Then add your Vercel URL under
Supabase → Authentication → URL Configuration → Site URL.

## Notes
- Never put the `service_role` key in this project. Only the publishable (anon) key is used in the browser.
- Wholesale prices are protected by the database (row-level security), not by the front end.
- Update shop address / phone / WhatsApp in Admin → Settings.
- Not built yet: automatic GST verification (admin checks GSTIN manually), email/WhatsApp order alerts.
