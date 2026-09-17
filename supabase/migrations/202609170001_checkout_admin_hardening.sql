-- ShopXzetio checkout/admin hardening
-- Apply after 202609160001_initial_shopxzetio_schema.sql and
-- 202609160002_guest_order_tracking.sql.

-- Keep a converted anonymous customer's profile in sync with Supabase Auth.
create or replace function public.handle_updated_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email,
      full_name = coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), full_name),
      phone = coalesce(nullif(new.raw_user_meta_data ->> 'phone', ''), phone),
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_updated_user();

revoke all on function public.handle_updated_user() from public, anon, authenticated;

-- Only delivered products can receive a customer review, and each customer can
-- submit one review per product.
create unique index if not exists reviews_one_per_customer_product
on public.reviews(user_id, product_id)
where user_id is not null and product_id is not null;

create or replace function public.verify_review_purchase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.product_id is not null and not public.is_admin() and not exists (
    select 1
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.customer_id = (select auth.uid())
      and o.order_status = 'delivered'
      and oi.product_id = new.product_id
  ) then
    raise exception 'Only delivered products can be reviewed';
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_require_purchase on public.reviews;
create trigger reviews_require_purchase
before insert on public.reviews
for each row execute function public.verify_review_purchase();

revoke all on function public.verify_review_purchase() from public, anon, authenticated;

-- Submitted review media remains private until an application deliberately
-- exposes an approved asset with a signed URL.
update storage.buckets set public = false where id = 'review-images';

drop policy if exists storage_review_owner_read_or_admin on storage.objects;
create policy storage_review_owner_read_or_admin on storage.objects
for select to authenticated
using (
  bucket_id = 'review-images'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
);

-- A customer can have at most one default address. Selecting a new default
-- automatically clears the previous one.
create or replace function public.ensure_single_default_address()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_default then
    update public.addresses
    set is_default = false, updated_at = now()
    where user_id = new.user_id
      and id is distinct from new.id
      and is_default = true;
  end if;
  return new;
end;
$$;

drop trigger if exists addresses_single_default on public.addresses;
create trigger addresses_single_default
before insert or update of is_default on public.addresses
for each row execute function public.ensure_single_default_address();

revoke all on function public.ensure_single_default_address() from public, anon, authenticated;

-- Preserve the original customer protection while allowing the two audited
-- security-definer functions below to perform controlled status transitions.
create or replace function public.protect_payment_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin()
    and coalesce(current_setting('shopxzetio.trusted_payment_update', true), 'false') <> 'true'
    and (
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

-- Attach a receipt and transition both payment records atomically. The path
-- must remain inside the current user's private storage folder.
create or replace function public.submit_payment_receipt(
  p_order_id uuid,
  p_receipt_path text,
  p_transaction_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order public.orders%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
    and (customer_id = v_user_id or public.is_admin())
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if not public.is_admin()
    and p_receipt_path not like v_user_id::text || '/' || p_order_id::text || '/%' then
    raise exception 'Invalid receipt storage path';
  end if;

  perform set_config('shopxzetio.trusted_payment_update', 'true', true);

  update public.payments
  set receipt_path = p_receipt_path,
      transaction_reference = nullif(trim(p_transaction_reference), ''),
      status = 'receipt_submitted',
      updated_at = now()
  where order_id = p_order_id
    and method <> 'cod';

  if not found then
    raise exception 'This order does not accept a payment receipt';
  end if;

  update public.orders
  set payment_status = 'receipt_submitted', updated_at = now()
  where id = p_order_id;

  insert into public.order_tracking (order_id, status, message, created_by)
  values (p_order_id, 'receipt_submitted', 'Payment receipt submitted for verification', v_user_id);

  return jsonb_build_object('order_id', p_order_id, 'payment_status', 'receipt_submitted');
end;
$$;

revoke all on function public.submit_payment_receipt(uuid, text, text) from public, anon;
grant execute on function public.submit_payment_receipt(uuid, text, text) to authenticated;

-- One admin operation updates payment, order, courier and tracking history.
create or replace function public.admin_update_order(
  p_order_id uuid,
  p_order_status text default null,
  p_payment_status text default null,
  p_courier text default null,
  p_tracking_number text default null,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select auth.uid());
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_order_status is not null and p_order_status not in
    ('placed', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled') then
    raise exception 'Unsupported order status';
  end if;

  if p_payment_status is not null and p_payment_status not in
    ('pending', 'awaiting_receipt', 'receipt_submitted', 'verified', 'rejected', 'refunded') then
    raise exception 'Unsupported payment status';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;

  update public.orders
  set order_status = coalesce(p_order_status, order_status),
      payment_status = coalesce(p_payment_status, payment_status),
      courier = case when p_courier is null then courier else nullif(trim(p_courier), '') end,
      tracking_number = case when p_tracking_number is null then tracking_number else nullif(trim(p_tracking_number), '') end,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  if p_payment_status is not null then
    perform set_config('shopxzetio.trusted_payment_update', 'true', true);
    update public.payments
    set status = p_payment_status,
        amount_received = case
          when p_payment_status = 'verified' then amount_required
          when p_payment_status in ('rejected', 'refunded') then 0
          else amount_received
        end,
        verified_by = case when p_payment_status = 'verified' then v_admin_id else null end,
        verified_at = case when p_payment_status = 'verified' then now() else null end,
        updated_at = now()
    where order_id = p_order_id
    returning * into v_payment;
  end if;

  if p_order_status is not null or p_payment_status is not null
     or p_courier is not null or p_tracking_number is not null then
    insert into public.order_tracking (
      order_id, status, message, courier, tracking_number, created_by
    ) values (
      p_order_id,
      coalesce(p_order_status, p_payment_status, v_order.order_status),
      coalesce(nullif(trim(p_message), ''), 'Order updated by ShopXzetio'),
      v_order.courier,
      v_order.tracking_number,
      v_admin_id
    );
  end if;

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_status', v_order.order_status,
    'payment_status', v_order.payment_status,
    'courier', v_order.courier,
    'tracking_number', v_order.tracking_number
  );
end;
$$;

revoke all on function public.admin_update_order(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.admin_update_order(uuid, text, text, text, text, text) to authenticated;

-- Replace order creation so limited stock is locked and decremented inside the
-- same transaction that creates the order.
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
    limit 1
    for update;
    if not found then raise exception 'Product % is unavailable', v_item ->> 'id'; end if;
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
    if v_product.stock_quantity is not null then
      update public.products
      set stock_quantity = stock_quantity - v_quantity, updated_at = now()
      where id = v_product.id;
    end if;
  end loop;

  insert into public.payments (order_id, submitted_by, method, amount_required, status)
  values (v_order_id, v_user_id, p_payment_method, v_payment_required, v_payment_status);
  insert into public.order_tracking (order_id, status, message, created_by)
  values (v_order_id, 'placed', 'Order received by ShopXzetio', v_user_id);

  return jsonb_build_object(
    'id', v_order_id, 'order_ref', v_order_ref, 'subtotal', v_subtotal,
    'shipping', v_shipping, 'total', v_total,
    'payment_status', v_payment_status, 'order_status', 'placed'
  );
end;
$$;

revoke all on function public.create_shop_order(jsonb, text, jsonb) from public, anon;
grant execute on function public.create_shop_order(jsonb, text, jsonb) to authenticated;
