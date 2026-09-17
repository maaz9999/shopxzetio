# ShopXzetio Supabase setup

This directory contains the reproducible database, RLS, Storage, and product-import foundation for ShopXzetio.

## 1. Create and configure the Supabase project

1. Create a Supabase project.
2. Enable Email/Password authentication.
3. Enable Anonymous Sign-Ins for guest checkout.
4. Set the Auth Site URL to the deployed site, then allow the deployed site and `http://localhost:5173` in Auth redirect URLs. Include the `/reset-password` path for password resets.
5. Apply all SQL migrations in filename order with the Supabase CLI or SQL editor:
   - `migrations/202609160001_initial_shopxzetio_schema.sql`
   - `migrations/202609160002_guest_order_tracking.sql`
   - `migrations/202609170001_checkout_admin_hardening.sql`

The migration creates:

- `profiles`, `products`, `addresses`, `orders`, `order_items`, `payments`, `reviews`, `wishlist`, `order_tracking`, and `notifications`
- a transactional `create_shop_order` RPC that calculates totals from database product prices
- RLS policies for customer ownership and admin access
- public `product-images` and `review-images` buckets
- private `payment-receipts` bucket

## 2. Configure the Vite application

Copy `.env.example` to `.env.local` and add the public browser credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Only the publishable key belongs in Vite or Vercel client environment variables. Never expose the service-role key through a `VITE_` variable.

Add the same two variables to the Vercel project for Preview and Production environments.
Redeploy after adding or changing them: Vite embeds these public values during the build.

## 3. Import the existing 22-product catalog

The importer reads the existing `js/products-data.js`; it does not invent or replace products. Run it only from a trusted local shell or CI secret environment:

```powershell
$env:SUPABASE_URL='https://your-project-ref.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'
npm run supabase:seed-products
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
```

The service-role key is intentionally not read by any frontend file.

## 4. Bootstrap the first administrator

Create the admin account through Supabase Auth, then run this once in the Supabase SQL editor with the real email address:

```sql
update public.profiles
set role = 'admin'
where email = 'owner@example.com';
```

Customers cannot update `role`; RLS and a database trigger enforce that boundary.

## Guest checkout security

Guest checkout uses `supabase.auth.signInAnonymously()` immediately before order creation. The visitor is not asked to register, but receives a private Auth identity used by RLS. The order and private receipt remain scoped to that identity. The application should offer account conversion after checkout so the customer can retain access across devices.

## Receipt object paths

Payment receipts must use this private bucket path format:

```text
{auth-user-id}/{order-id}/{random-file-name}
```

Customer access is restricted to the first path segment. Admin users may read receipts through RLS and should use authenticated downloads or short-lived signed URLs.
