-- ShopXzetio initial Supabase schema
-- Apply with the Supabase CLI or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

create sequence if not exists public.shopxzetio_order_ref_seq start 10000;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique not null,
  slug text unique not null,
  folder text,
  name text not null,
  short_name text,
  price numeric(12, 2) not null check (price >= 0),
  original_price numeric(12, 2) check (original_price is null or original_price >= price),
  category text not null,
  sub_category text,
  badge text,
  featured boolean not null default false,
  active boolean not null default true,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  rating numeric(2, 1) check (rating is null or rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  description text,
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  specs jsonb not null default '{}'::jsonb check (jsonb_typeof(specs) = 'object'),
  in_the_box jsonb not null default '[]'::jsonb check (jsonb_typeof(in_the_box) = 'array'),
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  main_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  province text,
  postal_code text,
  delivery_notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text unique not null,
  customer_id uuid references auth.users(id) on delete set null,
  is_guest boolean not null default false,
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  address_line text not null,
  city text not null,
  province text,
  postal_code text,
  delivery_notes text,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  shipping_amount numeric(12, 2) not null default 0 check (shipping_amount >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  payment_method text not null check (payment_method in ('cod', 'cod_advance', 'full_advance')),
  payment_status text not null default 'pending' check (
    payment_status in ('pending', 'awaiting_receipt', 'receipt_submitted', 'verified', 'rejected', 'refunded')
  ),
  order_status text not null default 'placed' check (
    order_status in ('placed', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled')
  ),
  courier text,
  tracking_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  product_legacy_id text,
  product_name text not null,
  product_image text,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique not null references public.orders(id) on delete cascade,
  submitted_by uuid references auth.users(id) on delete set null,
  method text not null check (method in ('cod', 'cod_advance', 'full_advance')),
  amount_required numeric(12, 2) not null default 0 check (amount_required >= 0),
  amount_received numeric(12, 2) not null default 0 check (amount_received >= 0),
  status text not null default 'pending' check (
    status in ('pending', 'awaiting_receipt', 'receipt_submitted', 'verified', 'rejected', 'refunded')
  ),
  receipt_path text,
  transaction_reference text,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  display_name text,
  review_text text,
  rating smallint check (rating is null or rating between 1 and 5),
  media_type text check (media_type is null or media_type in ('image', 'video')),
  media_path text,
  is_featured boolean not null default false,
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'hidden', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.order_tracking (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  message text,
  courier text,
  tracking_number text,
  event_time timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  notification_type text not null default 'order',
  order_id uuid references public.orders(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index orders_customer_id_idx on public.orders(customer_id);
create index orders_created_at_idx on public.orders(created_at desc);
create index orders_status_idx on public.orders(order_status, payment_status);
create index order_items_order_id_idx on public.order_items(order_id);
create index addresses_user_id_idx on public.addresses(user_id);
create index payments_order_id_idx on public.payments(order_id);
create index reviews_product_status_idx on public.reviews(product_id, approval_status);
create index order_tracking_order_id_idx on public.order_tracking(order_id, event_time desc);
create index notifications_user_id_idx on public.notifications(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger addresses_set_updated_at before update on public.addresses
for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments
for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
    and coalesce((select auth.role()), '') <> 'service_role'
    and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'Profile roles can only be changed by a trusted server administrator';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role before update on public.profiles
for each row execute function public.protect_profile_role();

create or replace function public.protect_payment_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() and (
    new.order_id is distinct from old.order_id
    or new.submitted_by is distinct from old.submitted_by
    or new.method is distinct from old.method
    or new.amount_required is distinct from old.amount_required
    or new.amount_received is distinct from old.amount_received
    or new.status is distinct from old.status
    or new.verified_by is distinct from old.verified_by
    or new.verified_at is distinct from old.verified_at
  ) then
    raise exception 'Customers may only attach their receipt path and transaction reference';
  end if;
  return new;
end;
$$;

create trigger payments_protect_verification before update on public.payments
for each row execute function public.protect_payment_verification();

create or replace function public.protect_review_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() and (
    new.approval_status is distinct from old.approval_status
    or new.is_featured is distinct from old.is_featured
  ) then
    raise exception 'Review moderation fields are admin-only';
  end if;
  return new;
end;
$$;

create trigger reviews_protect_moderation before update on public.reviews
for each row execute function public.protect_review_moderation();

create or replace function public.create_shop_order(
  p_customer jsonb,
  p_payment_method text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_guest boolean := coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false);
  v_order_id uuid;
  v_order_ref text;
  v_subtotal numeric(12, 2) := 0;
  v_shipping numeric(12, 2) := 0;
  v_total numeric(12, 2) := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_payment_status text;
  v_payment_required numeric(12, 2);
begin
  if v_user_id is null then
    raise exception 'An authenticated or anonymous Supabase session is required';
  end if;

  if p_payment_method not in ('cod', 'cod_advance', 'full_advance') then
    raise exception 'Unsupported payment method';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  if nullif(trim(p_customer ->> 'name'), '') is null
    or nullif(trim(p_customer ->> 'phone'), '') is null
    or nullif(trim(p_customer ->> 'city'), '') is null
    or nullif(trim(p_customer ->> 'address'), '') is null then
    raise exception 'Name, phone, city, and address are required';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(1, least(99, coalesce((v_item ->> 'quantity')::integer, 1)));

    select * into v_product
    from public.products
    where active = true
      and (legacy_id = v_item ->> 'id' or id::text = v_item ->> 'id')
    limit 1;

    if not found then
      raise exception 'Product % is unavailable', v_item ->> 'id';
    end if;

    if v_product.stock_quantity is not null and v_product.stock_quantity < v_quantity then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  v_shipping := case when v_subtotal >= 10000 then 0 else 250 end;
  v_total := v_subtotal + v_shipping;
  v_order_ref := 'SXZ-' || lpad(nextval('public.shopxzetio_order_ref_seq')::text, 5, '0');
  v_payment_status := case when p_payment_method = 'cod' then 'pending' else 'awaiting_receipt' end;
  v_payment_required := case
    when p_payment_method = 'cod' then 0
    when p_payment_method = 'cod_advance' then least(500, v_total)
    else v_total
  end;

  insert into public.orders (
    order_ref, customer_id, is_guest, customer_name, customer_email, customer_phone,
    address_line, city, province, postal_code, delivery_notes,
    subtotal, shipping_amount, total_amount, payment_method, payment_status, order_status
  ) values (
    v_order_ref, v_user_id, v_is_guest,
    trim(p_customer ->> 'name'), nullif(trim(p_customer ->> 'email'), ''), trim(p_customer ->> 'phone'),
    trim(p_customer ->> 'address'), trim(p_customer ->> 'city'),
    nullif(trim(p_customer ->> 'province'), ''), nullif(trim(p_customer ->> 'postal_code'), ''),
    nullif(trim(p_customer ->> 'notes'), ''),
    v_subtotal, v_shipping, v_total, p_payment_method, v_payment_status, 'placed'
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(1, least(99, coalesce((v_item ->> 'quantity')::integer, 1)));
    select * into v_product
    from public.products
    where active = true
      and (legacy_id = v_item ->> 'id' or id::text = v_item ->> 'id')
    limit 1;

    insert into public.order_items (
      order_id, product_id, product_legacy_id, product_name, product_image, unit_price, quantity
    ) values (
      v_order_id, v_product.id, v_product.legacy_id, v_product.name, v_product.main_image,
      v_product.price, v_quantity
    );
  end loop;

  insert into public.payments (
    order_id, submitted_by, method, amount_required, status
  ) values (
    v_order_id, v_user_id, p_payment_method, v_payment_required, v_payment_status
  );

  insert into public.order_tracking (order_id, status, message, created_by)
  values (v_order_id, 'placed', 'Order received by ShopXzetio', v_user_id);

  return jsonb_build_object(
    'id', v_order_id,
    'order_ref', v_order_ref,
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'total', v_total,
    'payment_status', v_payment_status,
    'order_status', 'placed'
  );
end;
$$;

revoke all on function public.create_shop_order(jsonb, text, jsonb) from public, anon;
grant execute on function public.create_shop_order(jsonb, text, jsonb) to authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.protect_profile_role() from public, anon, authenticated;
revoke all on function public.protect_payment_verification() from public, anon, authenticated;
revoke all on function public.protect_review_moderation() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;
alter table public.order_tracking enable row level security;
alter table public.notifications enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.products to anon, authenticated;
grant select, update (full_name, phone, updated_at) on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select, update, delete on public.products to authenticated;
grant insert on public.products to authenticated;
grant select, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, update on public.payments to authenticated;
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant select, insert, delete on public.wishlist to authenticated;
grant select, insert, update, delete on public.order_tracking to authenticated;
grant select, update (read_at), insert, delete on public.notifications to authenticated;

create policy products_public_read on public.products
for select to anon, authenticated using (active = true);
create policy products_admin_read_all on public.products
for select to authenticated using (public.is_admin());
create policy products_admin_insert on public.products
for insert to authenticated with check (public.is_admin());
create policy products_admin_update on public.products
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_admin_delete on public.products
for delete to authenticated using (public.is_admin());

create policy profiles_read_own_or_admin on public.profiles
for select to authenticated using ((select auth.uid()) = id or public.is_admin());
create policy profiles_update_own on public.profiles
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy addresses_manage_own_or_admin on public.addresses
for all to authenticated
using ((select auth.uid()) = user_id or public.is_admin())
with check ((select auth.uid()) = user_id or public.is_admin());

create policy orders_read_own_or_admin on public.orders
for select to authenticated using ((select auth.uid()) = customer_id or public.is_admin());
create policy orders_admin_update on public.orders
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy orders_admin_delete on public.orders
for delete to authenticated using (public.is_admin());

create policy order_items_read_through_order on public.order_items
for select to authenticated using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (orders.customer_id = (select auth.uid()) or public.is_admin())
  )
);
create policy order_items_admin_insert on public.order_items
for insert to authenticated with check (public.is_admin());
create policy order_items_admin_update on public.order_items
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy order_items_admin_delete on public.order_items
for delete to authenticated using (public.is_admin());

create policy payments_read_own_or_admin on public.payments
for select to authenticated using (
  exists (
    select 1 from public.orders
    where orders.id = payments.order_id
      and (orders.customer_id = (select auth.uid()) or public.is_admin())
  )
);
create policy payments_attach_own_receipt on public.payments
for update to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = payments.order_id and orders.customer_id = (select auth.uid())
  ) or public.is_admin()
)
with check (
  exists (
    select 1 from public.orders
    where orders.id = payments.order_id and orders.customer_id = (select auth.uid())
  ) or public.is_admin()
);

create policy reviews_public_read_approved on public.reviews
for select to anon, authenticated using (approval_status = 'approved');
create policy reviews_read_own_or_admin on public.reviews
for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy reviews_insert_own_permanent_user on public.reviews
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  and approval_status = 'pending'
  and is_featured = false
);
create policy reviews_update_own_pending_or_admin on public.reviews
for update to authenticated
using ((user_id = (select auth.uid()) and approval_status = 'pending') or public.is_admin())
with check ((user_id = (select auth.uid())) or public.is_admin());
create policy reviews_delete_own_pending_or_admin on public.reviews
for delete to authenticated
using ((user_id = (select auth.uid()) and approval_status = 'pending') or public.is_admin());

create policy wishlist_manage_own on public.wishlist
for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
);

create policy tracking_read_through_order on public.order_tracking
for select to authenticated using (
  exists (
    select 1 from public.orders
    where orders.id = order_tracking.order_id
      and (orders.customer_id = (select auth.uid()) or public.is_admin())
  )
);
create policy tracking_admin_insert on public.order_tracking
for insert to authenticated with check (public.is_admin());
create policy tracking_admin_update on public.order_tracking
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tracking_admin_delete on public.order_tracking
for delete to authenticated using (public.is_admin());

create policy notifications_read_own_or_admin on public.notifications
for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy notifications_mark_own_read on public.notifications
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy notifications_admin_insert on public.notifications
for insert to authenticated with check (public.is_admin());
create policy notifications_admin_delete on public.notifications
for delete to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('review-images', 'review-images', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('payment-receipts', 'payment-receipts', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy storage_admin_manage_product_images on storage.objects
for all to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

create policy storage_review_owner_upload on storage.objects
for insert to authenticated
with check (
  bucket_id = 'review-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
);
create policy storage_review_owner_manage on storage.objects
for update to authenticated
using (bucket_id = 'review-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'review-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy storage_review_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'review-images' and public.is_admin());

create policy storage_receipt_owner_upload on storage.objects
for insert to authenticated
with check (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy storage_receipt_owner_read_or_admin on storage.objects
for select to authenticated
using (
  bucket_id = 'payment-receipts'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
);
create policy storage_receipt_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'payment-receipts' and public.is_admin())
with check (bucket_id = 'payment-receipts' and public.is_admin());
create policy storage_receipt_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'payment-receipts' and public.is_admin());
