import { createClient } from '@supabase/supabase-js';
import products from '../js/products-data.js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the current shell before running this importer.\n'
    + 'Never use a VITE_ prefix for the service-role key.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const rows = products.map((product) => ({
  legacy_id: product.id,
  slug: product.id,
  folder: product.folder || null,
  name: product.name,
  short_name: product.shortName || null,
  price: product.price,
  original_price: product.originalPrice || null,
  category: product.category,
  sub_category: product.subCategory || null,
  badge: product.badge || null,
  featured: Boolean(product.featured),
  active: true,
  rating: product.rating || null,
  review_count: product.reviewCount || 0,
  description: product.description || null,
  features: product.features || [],
  specs: product.specs || {},
  in_the_box: product.inTheBox || [],
  images: product.images || [],
  main_image: product.mainImage || product.images?.[0] || null
}));

const { data, error } = await supabase
  .from('products')
  .upsert(rows, { onConflict: 'legacy_id' })
  .select('legacy_id');

if (error) {
  console.error('Product import failed:', error.message);
  process.exit(1);
}

console.log(`Imported ${data.length} ShopXzetio products into Supabase.`);
