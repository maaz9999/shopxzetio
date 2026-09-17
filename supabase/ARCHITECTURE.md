# ShopXzetio migration architecture

## Existing application map

| Area | Current source | Current persistence | Supabase target |
| --- | --- | --- | --- |
| Products | `js/products-data.js` via `src/data/products.js` | Static bundle | `products`, with static fallback during rollout |
| Cart | `src/context/CartContext.jsx` | `shopxzetio_cart_v1` in LocalStorage | Keep local; optionally merge/sync after login |
| Checkout | `src/components/CheckoutModal.jsx` | Local component state | `create_shop_order` RPC + Storage receipt upload |
| Orders | Checkout order object | `shopxzetio_order_history` in LocalStorage | `orders` + `order_items` + `payments` |
| Tracking | `OrderTrackerModal.jsx` | Incorrect `shopxzetio_orders` key + demo result | `orders` + `order_tracking` under RLS |
| Admin | `admin.html`/`js/admin.js` and React `AdminDashboard.jsx` | Hard-coded PIN + SessionStorage | Supabase Auth + admin role + RLS |
| Reviews | `ReviewsSection.jsx`, `ReviewMediaGallery.jsx` | Static local media metadata | Static-first, then `reviews` + `review-images` |
| Receipts | Checkout FileReader | DataURL embedded in LocalStorage order | Private `payment-receipts` object + `payments.receipt_path` |
| WhatsApp | Checkout success and cart fast-order | Generated URL | Preserve; persistent order is created first |
| Navigation | `currentView` in CartContext | In-memory state + path/hash checks | React routes for auth/account/admin; preserve storefront view controls |

## Rollout sequence

1. Apply the initial database migration and import the 22 existing products.
2. Add Auth context and account/auth routes without changing public browsing.
3. Integrate checkout with Anonymous Auth, transactional order creation, and private receipt upload.
4. Read customer orders, addresses, wishlist, notifications, and tracking from Supabase.
5. Route `/admin/login` and `/admin` through the React application and migrate the existing Admin Command Portal data source.
6. Remove the production PIN path only after the Supabase admin route is verified.
7. Move review management to Supabase while retaining the existing static review media as seeded content.
8. Run RLS allow/deny tests, browser flows, asset verification, and a Vite production build before deployment.

## Compatibility rules

- Product IDs from the current catalog are retained in `products.legacy_id` and `products.slug`.
- Order line items store immutable product name, image, and price snapshots.
- The cart continues to store the current compact item shape in LocalStorage.
- The customer-facing order reference remains `SXZ-#####`; internal relationships use UUIDs.
- Guest checkout uses an anonymous Supabase Auth user, so it remains account-free while still receiving an RLS identity.
- WhatsApp payload generation remains a frontend concern and runs only after the database confirms the order.
