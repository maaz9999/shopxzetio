# 🎮 SHOPXZETIO PAKISTAN — ESPORTS E-COMMERCE PLATFORM
## Comprehensive Technical, Architectural & Functional Documentation

---

## 📌 1. Project Overview & Business Vision

**ShopXzetio Pakistan** is a high-performance, single-page eCommerce platform engineered specifically for Pakistan's competitive mobile gaming and esports community (primarily PUBG Mobile, Call of Duty: Mobile, Free Fire, and tournament scrims).

### Core Problem Solved
Competitive mobile gamers experience severe device throttling (thermal drop from 120/90 FPS down to 45-50 FPS), audio latency, battery drainage while gaming, and sweat-induced touch friction. ShopXzetio provides tournament-grade hardware solutions:
- **Peltier Semiconductor Coolers** (20W active cryo-cooling)
- **Lossless 32-bit DAC Fast-Charge Splitters** (0ms audio latency + 60W bypass fast charging)
- **Esports Headsets & Earphones** (Acoustic spatial drivers for 360° footsteps pinpointing)
- **High-Conductivity Carbon/Silver Finger Sleeves & Tournament Cooling Fans**

The platform combines a cyberpunk esports aesthetic, 3D WebGL visuals, an interactive device compatibility matcher, live thermal benchmarks, dual-payment pipelines (COD + Online Advance verification with screenshot review), and an **Admin Command Portal**.

---

## 🛠️ 2. Technology Stack & System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SHOPXZETIO FRONTEND                             │
├────────────────────────────────┬───────────────────────────────────────┤
│  ⚡ React 18.3.1               │  Component-driven architecture        │
│  ⚡ Vite 6.0.7                 │  Next-gen ESM bundler & dev server    │
│  🎮 Three.js 0.185.1           │  Custom WebGL Volumetric Shader       │
│  🗄️ React Context API          │  Centralized state & cart persistence │
│  🎨 Modern Cyberpunk CSS3      │  Custom design system & glassmorphism │
│  📱 WhatsApp Business API      │  Direct order dispatch integration    │
│  💾 LocalStorage / Session     │  Client-side persistence & order DB   │
└────────────────────────────────┴───────────────────────────────────────┘
```

### Key Technologies:
1. **React 18**: Component-based UI with declarative state handling and custom hooks (`useCart`).
2. **Three.js & Custom GLSL Shaders**: Renders the dynamic 3D volumetric "Light Pillar" background using raymarching algorithms, custom vertex and fragment shaders.
3. **Vite 6**: Ultra-fast build tool with custom middleware routing for `/admin` and JSX transformation.
4. **Font Awesome 6 & Google Fonts**: `Rajdhani` (Cyberpunk display font), `Inter` (Body typography), and `Orbitron` / `Share Tech Mono` (Telemetry & digital timers).
5. **No Heavy Backend Required**: Operates with serverless client-side persistence and WhatsApp Direct Commerce integration, coupled with an in-browser Admin Order Management system.

---

## 📂 3. Directory & File Structure

```tree
SHOPXZETIO/
├── .git/                               # Git version control metadata
├── .gitignore                          # Ignored files (node_modules, dist, etc.)
├── index.html                          # Primary HTML entry point for the React application
├── admin.html                          # Standalone / fallback admin entry point
├── package.json                        # Project metadata, dependencies, and NPM scripts
├── package-lock.json                   # Dependency lockfile
├── vite.config.js                      # Vite configuration & server middleware
├── vercel.json                         # Vercel deployment & rewrite rules
├── push_to_github.bat                  # Automated git synchronization script
├── PROJECT_DOCUMENTATION.md            # Complete project documentation
│
├── public/                             # Public static assets
│   ├── favicon.ico                     # Favicon
│   └── assets/                         # Brand logos, banners, tournament imagery
│
├── assets/                             # Direct static image and brand assets
│   ├── brand/                          # Brand logos, hero graphics, watermarks
│   └── products/                       # Product gallery images
│
├── css/                                # Legacy & global stylesheet files
│   ├── style.css                       # Primary cyberpunk theme stylesheet
│   └── admin.css                       # Admin portal styling & table themes
│
├── js/                                 # Data definitions and utilities
│   ├── products-data.js                # Master catalog of 22+ esports hardware products
│   └── app.js                          # Legacy vanilla script (retained for backward compatibility)
│
├── scripts/                            # Build and asset validation automation
│   ├── build-data.js                   # Catalog builder & image path normalizer
│   └── verify-assets.js                # Static image integrity checker
│
└── src/                                # Modern React 18 Source Code
    ├── main.jsx                        # Application root rendering DOM mounting point
    ├── App.jsx                         # Main application controller & layout manager
    │
    ├── context/
    │   └── CartContext.jsx             # Central state management (Cart, Views, Modals, Toast)
    │
    ├── data/
    │   └── products.js                 # React wrapper & normalizer for product catalog
    │
    └── components/
        ├── Navbar.jsx                  # Header with search, categories, cart counter & modal links
        ├── Hero.jsx                    # Esports banner with CTA buttons & device matcher trigger
        ├── PartnershipSlider.jsx       # Infinite ticker of brand logos (HyperX, Piva, Plextone)
        ├── TrustBar.jsx                # Key value props (Official Warranty, COD Pakistan, Express)
        ├── HomeStorefront.jsx          # Featured grid, category tabs, and product discovery
        ├── ProductCard.jsx             # Individual product card with specs, pricing, and Add-to-Cart
        ├── ProductDetailModal.jsx      # High-res image gallery, full specs & technical review modal
        ├── CategoryPage.jsx            # Dynamic category view (Coolers, Audio, Splitters, Arsenal)
        ├── ProLoadouts.jsx             # Curated esports loadouts (Mobile Sniper, Streamer, Scrims Pro)
        ├── ThermalBenchmark.jsx        # Interactive FPS stability & temperature telemetry simulator
        ├── DeviceCompatibilityModal.jsx # Phone-to-hardware compatibility matcher (iPhone/Poco/Infinix)
        ├── CartDrawer.jsx              # Sliding cyber cart drawer with live subtotal & item qty
        ├── CheckoutModal.jsx           # Multi-tiered payment form (COD, Advance, Receipt upload)
        ├── OrderSuccessModal.jsx       # Order confirmation screen with instant WhatsApp trigger
        ├── OrderTrackerModal.jsx       # Real-time courier tracking modal (TCS/Leopards/Trax)
        ├── ReelsSection.jsx            # Video showcase reels from tournament scrims & unboxings
        ├── ReviewsSection.jsx          # Customer testimonials & tournament player reviews
        ├── PartnersSection.jsx         # Official Pakistan gaming teams & esports partners
        ├── Footer.jsx                  # Brand footer with quick links, policies & social channels
        ├── AdminDashboard.jsx          # Owner Command Portal with PIN auth, order table & SS review
        ├── LightPillar.jsx             # High-performance 3D WebGL volumetric shader background
        └── LightPillar.css             # Styling rules for WebGL container canvas
```

---

## 🎨 4. Key Functional Features & Deep Dive

### 4.1. Global 3D WebGL Volumetric Light Pillar (`LightPillar.jsx`)
- **Technology**: Built using Three.js and custom GLSL Vertex/Fragment shaders.
- **Shader Technique**: Employs a raymarching loop (`MAX_ITER = 24`) with smooth min wave distortions to generate a luminous, rotating cyber pillar of light in the background.
- **Performance Optimized**: Locked at a fixed pixel ratio with `precision mediump` and non-blocking RAF (Request Animation Frame) loops, ensuring a constant 60–120 FPS without CPU/GPU bottlenecks on both mobile devices and desktops.

---

### 4.2. State Management Architecture (`CartContext.jsx`)
`CartContext` manages the entire application state globally:
- **`items`**: Cart contents, synchronized in real-time to `localStorage` key `shopxzetio_cart_v1`.
- **`addToCart(product, qty)`**: Appends or increments quantity with an automated cyber toast alert.
- **`updateQuantity(id, delta)` / `removeFromCart(id)`**: Reactive quantity adjustments.
- **`currentView`**: Controls page navigation (`'home'`, `'coolers'`, `'audio'`, `'splitters'`, `'accessories'`, `'arsenal'`, `'admin'`).
- **Modal Controllers**: Global open/close triggers for Cart, Product Detail, Checkout, Order Success, Compatibility Matcher, and Order Tracker.

---

### 4.3. Interactive Thermal Benchmark (`ThermalBenchmark.jsx`)
An interactive telemetry dashboard allowing users to toggle between:
1. **Without Cryo Cooler (Stock Phone)**:
   - Average FPS: **58.4 FPS** (Severe 50% thermal throttling after 12 min)
   - Chipset Temperature: **47.8°C** (Overheating & battery drain)
   - Touch Latency: **14.8 ms** (Sweat friction & frame delay)
2. **With PIVA B2 Cryo Cooler (ShopXzetio)**:
   - Average FPS: **120.0 FPS** (Rock-solid locked performance in 5v5 scrims)
   - Chipset Temperature: **18.5°C** (Peltier 20W active cooling)
   - Touch Latency: **1.2 ms** (Instant gyro response & flick shots)

---

### 4.4. Device Compatibility Matcher (`DeviceCompatibilityModal.jsx`)
Solves the primary friction point for Pakistani gamers: *"Will this cooler fit my phone or iPad?"*
- Supported presets: **iPhone 15/16 Series**, **iPhone 12/13/14 Series**, **Poco X6 Pro / F5 / F6**, **Infinix GT 10/20 Pro**, **Samsung Galaxy S23/S24**, and **iPad Mini/Air/Pro**.
- Dynamically matches native MagSafe coolers, clamp radiators, magnetic heat-sink sheets, and high-wattage 60W Type-C or Lightning DAC splitters.
- Users can directly view specs or add matching items straight to their loadout.

---

### 4.5. Multi-Tier Checkout & WhatsApp Automation (`CheckoutModal.jsx`)
Supports the Pakistani market dynamics with 3 payment methodologies:
1. **100% Cash on Delivery (COD)**: Payment collected by courier rider upon doorstep delivery.
2. **COD + Rs. 500 Security Advance**: Reduces return-to-origin (RTO) bounce rates by securing shipping advance via JazzCash / EasyPaisa / Bank transfer, with the remaining balance collected via COD.
3. **Full Online Payment**: 100% upfront transfer.

#### Automated Features:
- **Receipt / Screenshot Upload**: Users can attach bank/JazzCash transaction slips directly in the checkout modal (encoded to DataURL and stored in order ledger).
- **Order Generation**: Assigns an ID (e.g., `#SXZ-84291`).
- **Direct WhatsApp Payload**: Generates a pre-formatted message sent directly to ShopXzetio's support WhatsApp (`+923348590229`) with all order metadata, item list, address, and payment method.

---

### 4.6. Real-Time Order & Courier Tracker (`OrderTrackerModal.jsx`)
- Allows customers to input their Order ID (e.g., `#SXZ-94821`) or WhatsApp number.
- Displays a visual 4-stage tracking stepper:
  1. `Order Placed`
  2. `Advance Verified`
  3. `Courier In-Transit` (with TCS / Leopards tracking code)
  4. `Delivered`
- Includes a direct one-click WhatsApp button to chat with the dispatch officer.

---

### 4.7. Owner Command Portal / Admin Dashboard (`AdminDashboard.jsx`)
Accessible via URL path `/admin` or `#admin`.

#### Security & Authentication:
- Protected by PIN Authentication (`xzetio2026` / `923348`).
- Session authenticated using `sessionStorage` (`shopxzetio_admin_session_v1`).

#### Administrative Capabilities:
- **Revenue & Pipeline KPIs**: Gross Sales Volume (PKR), Total Orders Count, Pending Payment Receipts, and Dispatched Orders.
- **Search & Filtering**: Filter by All, Receipts To Verify, Advance Verified, Full COD, and Dispatched. Full-text search across customer name, phone number, city, and order ID.
- **Receipt Lightbox with Zoom Controls**: Clickable payment screenshots with `+` / `-` zoom and "Mark Advance Verified" action.
- **Direct WhatsApp Customer Chat**: Automatically composes customized Urdu/English order update messages with current tracking numbers and status.
- **Tracking ID Management**: Direct input for TCS / Leopards / Trax tracking codes.
- **CSV Data Export**: One-click download of the complete customer and order ledger (`SHOPXZETIO_ORDERS_YYYY-MM-DD.csv`).
- **Test Order Generator**: Creates realistic test orders for staging and workflow simulation.

---

## 🛒 5. Hardware Catalog & Categories

The store features 22+ esports hardware products across key categories:

| Category | Key Products | Technical Highlights |
| :--- | :--- | :--- |
| **❄️ Coolers** | PIVA B2, PIVA B3, PIVA S6 Pro, PIVA X30, PIVA DS7, PIVA G71, Piva S6 Falcon | 20W Peltier semiconductor, magnetic MagSafe & clamp, RGB turbine fans, instant -5°C freeze |
| **🎧 Audio** | HyperX Cloud II Kingston, Cloud 3, Cloud Alpha S, Cloud Earbuds 2, G-Gaming | Dual-chamber 53mm acoustic drivers, noise-canceling mic, 3.5mm & USB soundcards |
| **⚡ Splitters** | Plextone GS1 Mark III, Plextone GS1 Type-C, Piva GS1 Pro, Piva GS3 Pro, Belkin 60W | 60W Power Delivery bypass charging + 32-bit/384kHz Hi-Res DAC audio chip |
| **🕹️ Accessories** | ShopXzetio Carbon-Silver Finger Sleeves (Pack of 5 Pairs), SOGO Heavy Duty Fans | 24-needle silver fiber zero-friction sleeves, 4000mAh portable tournament table fans |

---

## 🚀 6. Developer Guide & NPM Scripts

### Available Scripts:
```bash
# Start the local development server (Vite with hot module replacement on port 5173)
npm run dev

# Build optimized production bundle to /dist
npm run build

# Preview production build locally
npm run preview

# Run dev server on custom port 3000
npm run start

# Compile and synchronize master product data
npm run build:data

# Verify all product image assets and paths
npm run test:assets
```

---

## 🌐 7. Deployment Configuration

The repository includes a ready-to-deploy `vercel.json` configuration:
```json
{
  "rewrites": [
    { "source": "/admin", "destination": "/index.html" },
    { "source": "/admin/", "destination": "/index.html" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This ensures client-side routing, `/admin` direct access, and asset caching function smoothly across all hosting environments.

---

## 📞 8. Official Contact & Support Channels

- **Store Name**: ShopXzetio Pakistan
- **Specialty**: Premium Mobile Esports Hardware & PUBG Scrims Equipment
- **WhatsApp Support**: `+92 334 8590229`
- **Location**: Pakistan (Nationwide Express Delivery via TCS / Leopards / Trax)
