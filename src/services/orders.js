import { supabase } from '../lib/supabase';

export const PAYMENT_LABELS = {
  cod: 'Cash on Delivery (COD)',
  cod_advance: 'COD + Rs. 500 Advance',
  full_advance: 'Full Online Payment',
};

export async function createShopOrder({ customer, paymentMethod, items, receiptFile }) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('create_shop_order', {
    p_customer: customer,
    p_payment_method: paymentMethod,
    p_items: items.map((item) => ({ id: String(item.id), quantity: item.quantity })),
  });
  if (error) throw error;

  let receiptPath = null;
  let receiptError = null;
  if (receiptFile) {
    const { data: authData } = await supabase.auth.getUser();
    const safeName = receiptFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    receiptPath = `${authData.user.id}/${data.id}/${Date.now()}-${safeName}`;
    const upload = await supabase.storage.from('payment-receipts').upload(receiptPath, receiptFile, {
      cacheControl: '3600',
      contentType: receiptFile.type,
      upsert: false,
    });
    if (upload.error) {
      receiptPath = null;
      receiptError = upload.error.message;
    } else {
      const submission = await supabase.rpc('submit_payment_receipt', {
        p_order_id: data.id,
        p_receipt_path: receiptPath,
        p_transaction_reference: 'Customer receipt upload',
      });

      // Backwards-compatible fallback while the hardening migration is being
      // applied. It attaches the file without pretending it was verified.
      if (submission.error?.code === 'PGRST202') {
        const fallback = await supabase.from('payments')
          .update({ receipt_path: receiptPath, transaction_reference: 'Customer receipt upload' })
          .eq('order_id', data.id);
        if (fallback.error) receiptError = fallback.error.message;
      } else if (submission.error) {
        receiptError = submission.error.message;
      }
    }
  }
  return { ...data, receiptPath, receiptError };
}

export function buildWhatsAppUrl(order) {
  const lines = [
    `*CONFIRMED ORDER: #${order.orderRef}*`,
    '*Store:* ShopXzetio Pakistan Esports',
    '--------------------------------',
    `*Customer:* ${order.customer.fullName}`,
    `*Phone/WhatsApp:* ${order.customer.whatsapp}`,
    `*Email:* ${order.customer.email || 'N/A'}`,
    `*Shipping Address:* ${order.customer.address}, ${order.customer.city}, ${order.customer.province || ''}`,
    '--------------------------------',
    '*Order Items:*',
    ...order.items.map((item, index) => `${index + 1}. ${item.name} x${item.quantity}`),
    '--------------------------------',
    `*Grand Total:* Rs. ${Number(order.total).toLocaleString()}`,
    `*Payment Mode:* ${order.paymentMethod}`,
    '*Database order created successfully.*',
  ];
  return `https://wa.me/923348590229?text=${encodeURIComponent(lines.join('\n'))}`;
}

export async function fetchMyOrders() {
  const { data, error } = await supabase.from('orders').select(`
    *, order_items(*), payments(*), order_tracking(*)
  `).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
