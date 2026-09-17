-- Limited guest order lookup. This does not expose delivery addresses or other private customer data.
create or replace function public.track_shop_order(p_order_ref text, p_contact text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
  v_events jsonb;
begin
  if length(trim(coalesce(p_order_ref, ''))) < 7 or length(trim(coalesce(p_contact, ''))) < 5 then
    return null;
  end if;

  select * into v_order from public.orders
  where upper(order_ref) = upper(regexp_replace(trim(p_order_ref), '^#', ''))
    and (
      lower(coalesce(customer_email, '')) = lower(trim(p_contact))
      or regexp_replace(customer_phone, '\D', '', 'g') = regexp_replace(p_contact, '\D', '', 'g')
    )
  limit 1;
  if not found then return null; end if;

  select coalesce(jsonb_agg(jsonb_build_object('name', product_name, 'quantity', quantity, 'line_total', line_total)), '[]'::jsonb)
    into v_items from public.order_items where order_id = v_order.id;
  select coalesce(jsonb_agg(jsonb_build_object('status', status, 'message', message, 'event_time', event_time) order by event_time), '[]'::jsonb)
    into v_events from public.order_tracking where order_id = v_order.id;

  return jsonb_build_object(
    'order_ref', v_order.order_ref, 'created_at', v_order.created_at, 'city', v_order.city,
    'total', v_order.total_amount, 'payment_status', v_order.payment_status,
    'order_status', v_order.order_status, 'courier', v_order.courier,
    'tracking_number', v_order.tracking_number, 'items', v_items, 'events', v_events
  );
end;
$$;

revoke all on function public.track_shop_order(text, text) from public;
grant execute on function public.track_shop_order(text, text) to anon, authenticated;
