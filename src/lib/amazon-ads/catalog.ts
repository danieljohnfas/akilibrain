/**
 * Central Amazon Associates Catalog & Multi-Site Configuration
 * Unified Store/Tracking ID: photoid03-20
 * Eligible Websites (6):
 *  - getnyash.com
 *  - photosplitstudio.com
 *  - is-my-internet-working.com
 *  - audiorap.com
 *  - tiketichap.com
 *  - akilibrain.com
 *
 * Strictly Excluded (Adult Content Policy Compliance):
 *  - hentaivault.me
 */

export const AMAZON_ASSOCIATE_TAG = 'photoid03-20';

export type EligibleSiteKey =
  | 'getnyash'
  | 'photosplitstudio'
  | 'is-my-internet-working'
  | 'audiorap'
  | 'tiketichap'
  | 'akilibrain';

export interface SiteConfig {
  key: EligibleSiteKey;
  domain: string;
  name: string;
  niche: string;
  modality: string;
  defaultSearchKeywords: string[];
  slots: Array<{
    key: string;
    label: string;
    placementDescription: string;
  }>;
}

export const BLOCKED_DOMAINS = new Set(['hentaivault.me', 'www.hentaivault.me']);

export const ELIGIBLE_SITES: Record<EligibleSiteKey, SiteConfig> = {
  getnyash: {
    key: 'getnyash',
    domain: 'getnyash.com',
    name: 'GetNyash',
    niche: 'Curves, Glute Fitness, Shapewear & Beauty',
    modality: 'Native Product Comparison Cards + Inline Guide Callouts + Sticky Trending Bar',
    defaultSearchKeywords: [
      'scrunch butt lifting leggings women',
      'colombian faja shapewear tummy control',
      'fabric glute resistance bands workout',
      'cable kickback ankle straps gym',
      'padded hip enhancer shapewear shorts',
      'maca root capsules women curves',
    ],
    slots: [
      { key: 'home-spotlight', label: 'Homepage Trending Spotlight', placementDescription: 'Above-the-fold & mid-page curated product grid on /' },
      { key: 'category-podium', label: 'Category Comparison Podium', placementDescription: 'Top-3 comparison table & product cards on /[category]' },
      { key: 'article-inline', label: 'Editorial Article Inline & Footer', placementDescription: 'Contextual product box inside /articles/[slug]' },
      { key: 'sticky-bar', label: 'Sitewide Trending Picks Bar', placementDescription: 'Bottom quick-shop bar across all pages' },
    ],
  },
  photosplitstudio: {
    key: 'photosplitstudio',
    domain: 'photosplitstudio.com',
    name: 'PhotoSplit Studio',
    niche: 'Instagram Grid Splitter, Carousel Maker & Creator Gear',
    modality: 'Post-Export Creator Gear Bar + Studio Sidebar + Blog Inline Hardware Cards',
    defaultSearchKeywords: [
      'phone tripod with remote wireless',
      'magsafe ring light for iphone',
      'portable ssd 1tb usb c creators',
      'wireless lavalier microphone iphone usb c',
      'sd card reader usb c high speed',
      'color calibrated 4k monitor photo editing',
    ],
    slots: [
      { key: 'app-post-export', label: 'Post-Split Export Modal & Workspace Bar', placementDescription: 'High-intent creator gear bar shown in app.html during/after grid export' },
      { key: 'sidebar', label: 'Creator Studio Sidebar', placementDescription: 'Left/Right 300px sidebar product cards on index.html & app.html' },
      { key: 'blog-inline', label: 'Blog Guide Inline & Grid', placementDescription: 'Contextual creator hardware cards across all 6 blog/*.html guides' },
      { key: 'banner-top-bottom', label: 'Top & Bottom Leaderboard Banners', placementDescription: 'Header and footer featured product strips' },
    ],
  },
  'is-my-internet-working': {
    key: 'is-my-internet-working',
    domain: 'is-my-internet-working.com',
    name: 'Is My Internet Working',
    niche: 'Internet Diagnostics, Speed/Bufferbloat Testing & Networking Hardware',
    modality: 'Diagnostic-Triggered Hardware Prescriptions + Always-On Network Upgrade Shelf',
    defaultSearchKeywords: [
      'WiFi 6E mesh router system',
      'GL.iNet Flint 2 WiFi 6 router SQM OpenWrt',
      'Cat 6A ethernet cable 25ft braided',
      'mini UPS battery backup for wifi router modem',
      'USB C to 2.5Gb ethernet adapter',
      'DOCSIS 3.1 cable modem gigabit',
    ],
    slots: [
      { key: 'diagnostic-prescription', label: 'Speed & Bufferbloat Prescription', placementDescription: 'Dynamic router/cable recommendation after speed or latency check on / and /speed-test/' },
      { key: 'network-upgrade-grid', label: 'Always-On Network Upgrade Shelf', placementDescription: 'Hardware cards on /, /speed-test/, /what-is-my-ip/, and /monitor/' },
      { key: 'fix-guide-inline', label: 'Fix Guide Step-by-Step Hardware', placementDescription: 'Inline diagnostic fix hardware cards on /fix/' },
      { key: 'status-outage-shelf', label: 'Service Status & Outage Stability Gear', placementDescription: 'Ethernet, Mini-UPS, and low-latency router cards on /status/ and /is-*-down/' },
    ],
  },
  audiorap: {
    key: 'audiorap',
    domain: 'audiorap.com',
    name: 'AudioRap',
    niche: 'Vocal/Beat Stem Extraction, Music Production & DJ Hardware',
    modality: 'Post-Extraction Stem Monitoring Callout + Interactive 4-Category Studio Gear Showcase',
    defaultSearchKeywords: [
      'Audio-Technica ATH-M50x studio monitor headphones',
      'Focusrite Scarlett 2i2 4th Gen USB audio interface',
      'Shure MV7+ podcast vocal microphone USB XLR',
      'Akai Professional MPK Mini MK3 MIDI controller',
      'Beyerdynamic DT 990 Pro 250 ohm studio headphones',
      'PreSonus Eris 3.5 studio monitors pair',
    ],
    slots: [
      { key: 'post-extraction', label: 'Post-Extraction Stem Monitoring Box', placementDescription: 'Displayed inside ExtractionResult.jsx immediately below extracted vocal/beat stems' },
      { key: 'studio-showcase', label: 'Studio & DJ Hardware Grid', placementDescription: 'Filterable 4-category gear grid in GearLinks.jsx' },
    ],
  },
  tiketichap: {
    key: 'tiketichap',
    domain: 'tiketichap.com',
    name: 'TiketiChap',
    niche: 'Tanzania & East Africa Bus, SGR Train, Ferry & Safari Travel',
    modality: 'Route-Contextual Travel Essentials Kit Cards (Bus/SGR/Ferry/Safari)',
    defaultSearchKeywords: [
      'Anker 20000mAh power bank fast charging travel',
      'Type G UK Tanzania travel plug adapter USB C',
      'waterproof dry bag phone pouch beach boat ferry',
      'compact binoculars 10x42 safari wildlife',
      'noise cancelling wireless earbuds travel bus',
      'memory foam travel neck pillow airplane bus',
    ],
    slots: [
      { key: 'route-essentials', label: 'Route Detail Travel Essentials', placementDescription: 'Route-specific packing & power gear on /routes/[slug]' },
      { key: 'destination-extras', label: 'Destination Tourist Extras', placementDescription: 'Safari & beach travel hardware inside destination-extras.js' },
      { key: 'home-travel-kit', label: 'Homepage East Africa Travel Kit', placementDescription: 'Featured travel gear grid on tiketichap.com homepage' },
    ],
  },
  akilibrain: {
    key: 'akilibrain',
    domain: 'akilibrain.com',
    name: 'AkiliBrain',
    niche: 'East Africa Jobs, Government Tenders, Salaries, Compliance & Career Prep',
    modality: 'Role-Matched Remote Work Gear + Exam Prep Books + Tender Office Equipment',
    defaultSearchKeywords: [
      'noise cancelling USB headset with microphone remote work',
      '1080p webcam with ring light zoom interviews',
      'PMP exam prep book project management',
      'duplex document scanner high speed office tenders',
      'ergonomic aluminum laptop stand desk',
      'CPA ACCA financial accounting study guide book',
    ],
    slots: [
      { key: 'job-detail-sidebar', label: 'Job Detail Remote Interview & Office Box', placementDescription: 'Sidebar & footer gear callout on /jobs/[id]' },
      { key: 'career-resources', label: 'Jobs, Salaries & Hub Career Resources', placementDescription: 'Amazon career books & remote work kit on /jobs, /jobs/[...slug], and /salaries' },
      { key: 'tender-office-gear', label: 'Tender Procurement & Office Equipment', placementDescription: 'Document scanners & FIDIC/PMP books on /tenders and /tenders/[id]' },
      { key: 'guide-compliance-inline', label: 'Guides & Compliance Bookshelf', placementDescription: 'Professional exam & compliance hardware/books on /guides/[slug] and /compliance' },
    ],
  },
};

const COUNTRY_TO_AMAZON_DOMAIN: Record<string, string> = {
  US: 'www.amazon.com',
  GB: 'www.amazon.co.uk',
  UK: 'www.amazon.co.uk',
  CA: 'www.amazon.ca',
  DE: 'www.amazon.de',
  FR: 'www.amazon.fr',
  ES: 'www.amazon.es',
  IT: 'www.amazon.it',
  AU: 'www.amazon.com.au',
  JP: 'www.amazon.co.jp',
  NL: 'www.amazon.nl',
  SE: 'www.amazon.se',
  PL: 'www.amazon.pl',
  SG: 'www.amazon.sg',
  AE: 'www.amazon.ae',
  SA: 'www.amazon.sa',
  IN: 'www.amazon.in',
  BR: 'www.amazon.com.br',
  MX: 'www.amazon.com.mx',
};

export function resolveSiteKey(input: string): EligibleSiteKey | null {
  const cleaned = (input || '')
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .replace(/\.(com|me|org|net)$/, '');

  if (cleaned.includes('hentaivault')) {
    return null; // Explicitly blocked per Amazon Associates Operating Agreement
  }
  if (cleaned === 'getnyash') return 'getnyash';
  if (cleaned === 'photosplitstudio') return 'photosplitstudio';
  if (cleaned === 'is-my-internet-working') return 'is-my-internet-working';
  if (cleaned === 'audiorap') return 'audiorap';
  if (cleaned === 'tiketichap') return 'tiketichap';
  if (cleaned === 'akilibrain') return 'akilibrain';
  return null;
}

export const VERIFIED_DIRECT_ASINS = new Set([
  'B08SBFTXQT', // PMP Exam Prep Simplified (Andrew Ramdayal)
  'B006JH8T3S', // Logitech C920x HD Pro Webcam 1080p with Stereo Audio
  'B07S92QBCJ', // Logitech MX Keys Advanced Wireless Illuminated Keyboard
  'B07S395RWD', // Logitech MX Master 3S Wireless Performance Mouse
  'B08CVTTNN4', // ASUS ZenScreen 15.6" Full HD Portable USB-C Monitor
  'B0874M3KW4', // Anker 555 USB-C Hub (8-in-1 with 100W PD and 4K HDMI)
  '1449373321', // Designing Data-Intensive Applications by Martin Kleppmann
  '1260464008', // CompTIA Security+ Get Certified Get Ahead: SY0-701
  'B0863TXGM3', // Sony WH-1000XM4 Wireless Premium Noise-Canceling Headphones
  '0132350882', // Clean Code: A Handbook of Agile Software Craftsmanship
  'B078STRHBX', // Samsung 970 EVO Plus 1TB NVMe M.2 Internal SSD
  'B09W2PNLX7', // Anker Nano II 65W GaN Fast Charger Foldable
  '1718502702', // Python Crash Course 3rd Edition by Eric Matthes
  'B01054S5FM', // WHOOSH! Screen Cleaner Kit for Monitors, Laptops
  '109811020X', // Kubernetes: Up and Running 3rd Edition by Kelsey Hightower
  'B0CXDXP8VR', // Anker 20,000mAh 30W Fast-Charge Portable Power Bank
  'B006U0Z3BA', // Bushnell 10x42 H2O Waterproof Fogproof Roof Prism
  'B000G7WRBC', // Surviveware Small First Aid Kit 100-Piece Waterproof
  'B01IT9NLHW', // Liquid I.V. Hydration Multiplier Electrolyte Powder
  'B00004SABD', // Oakley Holbrook Polarized Sunglasses with Prizm Lens
  'B001ANQVYU', // Sawyer Products Premium Permethrin Fabric Insect Repellent
  'B0007VM8UC', // SABRE Red Pepper Spray with Quick Release Key Ring
  'B08GTYFC37', // SanDisk 1TB Extreme Portable NVMe SSD USB-C
  'B08GY8NHF2', // SanDisk 128GB Extreme PRO SDXC UHS-I Memory Card
  'B00017LSPI', // Giottos Rocket Air Blaster Large Dust-Removal Tool
  'B00007E7JU', // LensPen Original Camera Lens & Scanner Sensor Cleaner
  'B00006B70O', // Epson Premium Photo Paper GLOSSY (8.5x11, 50 Sheets)
  'B00006B70P', // Canon Photo Paper Plus Semi-Gloss (4x6, 50 Sheets)
  'B00004SABF', // Gepe 35mm Glassless Slide Mounts (100-Pack)
  'B00004SABG', // Fiskars 12" SureCut Deluxe Craft Paper Trimmer
  'B00004SABH', // Carson LumiLoupe 10x Power Stand Magnifier Loupe
  'B00004Z47L', // Scotch 3M Removable Double Sided Photo Safe Scrapbook
  'B00004SABJ', // Kinetronics StaticWisk SW-030 30mm Anti-Static Brush
  'B0CP7S8X1Q', // GL.iNet GL-MT6000 (Flint 2) Wi-Fi 6 Router
  'B09PRB1MZM', // TP-Link Deco AX3000 WiFi 6 Mesh System (Deco X55 3-Pack)
  'B091G63T4G', // eero Pro 6E Tri-Band Mesh Wi-Fi 6E System (3-Pack)
  'B08XWKF55C', // TP-Link TL-SG105 5-Port Gigabit Unmanaged Ethernet
  'B00AWRUICG', // TP-Link AV2000 Gigabit Powerline Starter Kit (2-Pack)
  'B0BCMLLSHL', // CyberPower CP1500AVRLCD3 Intelligent LCD UPS Battery
  'B08RHD97QY', // TP-Link RE700X WiFi 6 Range Extender Dual Band
  'B01M63EMBQ', // Klein Tools VDV526-100 LAN Scout Jr. 2 Cable Tester
  'B00BP0SSAS', // TP-Link TL-PoE150S Gigabit PoE Injector 802.3af
  'B00JLV4BWC', // AC Infinity MULTIFAN S3 Quiet 120mm USB Fan for Router
  'B0016AIYU6', // Tupavco TP303 Ethernet Surge Protector Gigabit ESD
  'B08LN3C7WK', // Kasa Smart Plug with Energy Monitoring (4-Pack)
  'B07W4MD9L8', // Bangun SC/APC to SC/APC Fiber Optic Internet Cable
  'B00HVLUR86', // Audio-Technica ATH-M50x Professional Studio Monitor
  'B0886ZPWC8', // Akai Professional MPK Mini MK3 25-Key MIDI Pad Controller
  'B0011UB9CQ', // Beyerdynamic DT 990 PRO 250 Ohm Open-Back Studio
  'B00DUKP37C', // Yamaha HS5 Powered Studio Monitor (Pair)
  'B002QAUOKS', // Rode NT1-A Large-Diaphragm Cardioid Studio Condenser
  'B000065BP9', // Sony MDR-7506 Professional Large-Diaphragm Headphone
  'B0002E4Z8M', // Shure SM7B Vocal Dynamic Microphone for Broadcast
  'B000978D58', // K&M 210/9 Professional Telescoping Boom Microphone Stand
  'B001RCD2DW', // Beyerdynamic DT 770 PRO 80 Ohm Closed Studio Headphone
  'B008AOH1O6', // Stedman Corporation Proscreen XL Metal Pop Filter
  'B0006H92QK', // Audio-Technica AT2020 Cardioid Studio Condenser Mic
  'B088HHWC47', // Elgato Wave:3 Premium USB Condenser Microphone
  'B07VDQQY95', // AudioQuest DragonFly Red USB DAC & Headphone Amp
  'B0016MNAAI', // Sennheiser HD 600 Open-Back Audiophile Headphones
  'B000052YP6', // Palmers Cocoa Butter Formula Massage Lotion
  'B000ORV3NC', // Weleda Skin Food Original Ultra-Rich Body Cream
  'B0BP9MDCQZ', // Amazon Fire TV Stick 4K Max with Wi-Fi 6E Support
  'B08GTYFC39', // SanDisk 512GB Ultra Dual Drive Luxe USB Type-C Flash Drive
  'B00004SABP', // ProTapes Artist Tape Flatback Printable Paper Tape
  '1607741709', // The 2-Hour Job Search (Steve Dalton)
  'B07DWM9WNM', // Nulaxy Ergonomic Aluminum Laptop Stand
  'B000GFSVPU', // Optimum Nutrition Gold Standard
  'B075QVMBT9', // PreSonus Eris 3.5 Studio Monitors
]);

export function buildAmazonUrl(params: {
  asin?: string | null;
  searchQuery: string;
  countryCode?: string;
  tag?: string;
  preferDirectAsin?: boolean;
}): string {
  const tag = params.tag || AMAZON_ASSOCIATE_TAG;
  const cc = (params.countryCode || 'US').toUpperCase();
  const host = COUNTRY_TO_AMAZON_DOMAIN[cc] || 'www.amazon.com';

  // Normalize legacy or typo ASINs
  let effectiveAsin = params.asin;
  if (effectiveAsin === 'B08M8K9L3N') {
    effectiveAsin = 'B08SBFTXQT';
  }

  // Direct DP link only if strictly verified live on Amazon
  if (effectiveAsin && params.preferDirectAsin !== false && VERIFIED_DIRECT_ASINS.has(effectiveAsin)) {
    return `https://${host}/dp/${encodeURIComponent(effectiveAsin)}?tag=${encodeURIComponent(tag)}`;
  }
  // Guaranteed 100% live zero-dog fallback: keyword search with associate tag
  return `https://${host}/s?k=${encodeURIComponent(params.searchQuery)}&tag=${encodeURIComponent(tag)}`;
}

export function localizeAmazonUrl(rawUrl: string, countryCode = 'US', tag = AMAZON_ASSOCIATE_TAG): string {
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.hostname.includes('amazon.')) return rawUrl;
    const cc = (countryCode || 'US').toUpperCase();
    parsed.hostname = COUNTRY_TO_AMAZON_DOMAIN[cc] || 'www.amazon.com';
    parsed.searchParams.set('tag', tag);
    return parsed.toString();
  } catch {
    return `https://www.amazon.com/s?k=${encodeURIComponent(rawUrl)}&tag=${encodeURIComponent(tag)}`;
  }
}

export interface SeedAmazonProduct {
  id: string;
  siteKey: EligibleSiteKey;
  domain: string;
  slotKey: string;
  category: string;
  asin: string;
  title: string;
  description: string;
  searchQuery: string;
  priceEstimate: string;
  rating: number;
  badge: string;
  ctaText: string;
  status: 'active' | 'candidate' | 'quarantined_dog' | 'retired_low_ctr';
  impressions: number;
  clicks: number;
}

export const INITIAL_PRODUCT_CATALOG: SeedAmazonProduct[] = [
  // ============================================================================
  // 1. GETNYASH.COM (Curves, Glute Fitness, Shapewear & Beauty)
  // ============================================================================
  {
    id: 'gn-active-1',
    siteKey: 'getnyash',
    domain: 'getnyash.com',
    slotKey: 'home-spotlight',
    category: 'butt-lifting-leggings',
    asin: 'B08R65M3V9',
    title: 'AUROLA Seamless Scrunch Butt-Lifting Workout Leggings',
    description: 'High-waisted squat-proof glute contouring leggings with hidden scrunch seam and tummy compression.',
    searchQuery: 'AUROLA seamless scrunch butt lifting leggings women high waisted',
    priceEstimate: '$28.99',
    rating: 4.6,
    badge: '#1 Reader Pick',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 640,
    clicks: 48,
  },
  {
    id: 'gn-active-2',
    siteKey: 'getnyash',
    domain: 'getnyash.com',
    slotKey: 'category-podium',
    category: 'shapewear-fajas',
    asin: 'B07T2K3M9Q',
    title: 'SONRYSE 065WHM Colombian High-Compression Faja Bodysuit',
    description: 'Authentic powernet Colombian faja with natural BBL glute lift panel and 3-row hook waist cincher.',
    searchQuery: 'SONRYSE Colombian faja high compression bodysuit butt lifter',
    priceEstimate: '$69.99',
    rating: 4.5,
    badge: 'Best Sculpting',
    ctaText: 'Shop on Amazon',
    status: 'active',
    impressions: 510,
    clicks: 39,
  },
  {
    id: 'gn-active-3',
    siteKey: 'getnyash',
    domain: 'getnyash.com',
    slotKey: 'article-inline',
    category: 'booty-bands-weights',
    asin: 'B07D1647M7',
    title: 'Arena Strength Fabric Booty Bands (Set of 3 + Workout Guide)',
    description: 'Non-slip woven fabric glute activation bands for hip thrusts, abductions, and home lower-body hypertrophy.',
    searchQuery: 'fabric glute resistance bands women set of 3 non slip',
    priceEstimate: '$21.95',
    rating: 4.8,
    badge: 'Gym Essential',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 430,
    clicks: 31,
  },
  {
    id: 'gn-active-4',
    siteKey: 'getnyash',
    domain: 'getnyash.com',
    slotKey: 'sticky-bar',
    category: 'booty-bands-weights',
    asin: 'B01N4I84QN',
    title: 'DMoose Neoprene Padded Cable Kickback Ankle Straps (Pair)',
    description: 'Heavy-duty double D-ring ankle cuffs for targeted glute medius and maximus cable kickbacks.',
    searchQuery: 'DMoose ankle straps for cable machines kickbacks glutes',
    priceEstimate: '$16.99',
    rating: 4.7,
    badge: 'Top Rated',
    ctaText: 'Buy on Amazon',
    status: 'active',
    impressions: 380,
    clicks: 27,
  },
  {
    id: 'gn-cand-1',
    siteKey: 'getnyash',
    domain: 'getnyash.com',
    slotKey: 'home-spotlight',
    category: 'padded-underwear',
    asin: 'B09K7L4M2P',
    title: ' seamless Hip Dip & Booty Enhancer Boyshort Shapewear',
    description: 'Removable contoured foam hip and glute pads under bodycon dresses and jeans.',
    searchQuery: 'seamless hip dip padded shapewear shorts butt lifter women',
    priceEstimate: '$26.99',
    rating: 4.4,
    badge: 'Instant Curve',
    ctaText: 'Check Price on Amazon',
    status: 'candidate',
    impressions: 0,
    clicks: 0,
  },
  {
    id: 'gn-cand-2',
    siteKey: 'getnyash',
    domain: 'getnyash.com',
    slotKey: 'article-inline',
    category: 'supplements-nutrition',
    asin: 'B000GFSVPU',
    title: 'Optimum Nutrition Gold Standard 100% Whey Protein (2 lb)',
    description: '24g fast-absorbing whey protein isolate per scoop to fuel glute recovery and lower-body muscle growth.',
    searchQuery: 'Optimum Nutrition Gold Standard 100 Whey Protein',
    priceEstimate: '$34.99',
    rating: 4.8,
    badge: 'Muscle Fuel',
    ctaText: 'View on Amazon',
    status: 'candidate',
    impressions: 0,
    clicks: 0,
  },

  // ============================================================================
  // 2. PHOTOSPLITSTUDIO.COM (Instagram Grid Splitter, Carousel & Creator Gear)
  // ============================================================================
  {
    id: 'ps-active-1',
    siteKey: 'photosplitstudio',
    domain: 'photosplitstudio.com',
    slotKey: 'app-post-export',
    category: 'creator-lighting',
    asin: 'B09Q5K9L3M',
    title: 'Sensyne 12" Ring Light with 62" Extendable Phone Tripod & Remote',
    description: 'Even 3-color LED lighting and Bluetooth shutter remote for seamless panorama and grid shoots.',
    searchQuery: 'ring light with tripod stand for iphone content creator',
    priceEstimate: '$29.99',
    rating: 4.6,
    badge: 'Creator #1 Pick',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 520,
    clicks: 36,
  },
  {
    id: 'ps-active-2',
    siteKey: 'photosplitstudio',
    domain: 'photosplitstudio.com',
    slotKey: 'sidebar',
    category: 'storage',
    asin: 'B08GTYFC37',
    title: 'SanDisk 1TB Extreme Portable SSD (Up to 1050MB/s USB-C)',
    description: 'IP65 water/dust-resistant NVMe portable SSD for storing high-res RAW panoramas, carousels, and 4K Reels.',
    searchQuery: 'SanDisk 1TB Extreme Portable SSD USB-C',
    priceEstimate: '$89.99',
    rating: 4.8,
    badge: 'Fast Workflow',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 410,
    clicks: 29,
  },
  {
    id: 'ps-active-3',
    siteKey: 'photosplitstudio',
    domain: 'photosplitstudio.com',
    slotKey: 'blog-inline',
    category: 'tripods-gimbals',
    asin: 'B09X1Z8M4N',
    title: 'DJI Osmo Mobile 6 3-Axis Smartphone Gimbal Stabilizer',
    description: 'Built-in extension rod, ActiveTrack 6.0, and automated clone/panorama alignment for flawless multi-slide carousels.',
    searchQuery: 'DJI Osmo Mobile 6 smartphone gimbal stabilizer',
    priceEstimate: '$139.00',
    rating: 4.7,
    badge: 'Pro Panorama',
    ctaText: 'Shop on Amazon',
    status: 'active',
    impressions: 350,
    clicks: 24,
  },
  {
    id: 'ps-active-4',
    siteKey: 'photosplitstudio',
    domain: 'photosplitstudio.com',
    slotKey: 'banner-top-bottom',
    category: 'audio',
    asin: 'B0B8H9K2L1',
    title: 'Hollyland Lark M2 Wireless Lavalier Microphone (USB-C & Lightning)',
    description: 'Button-sized 48kHz/24bit studio wireless clip-on mic with ENC noise cancellation for Instagram Reels & TikTok.',
    searchQuery: 'Hollyland Lark M2 wireless lavalier microphone iphone usb c',
    priceEstimate: '$119.00',
    rating: 4.8,
    badge: 'Reels Audio',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 290,
    clicks: 19,
  },
  {
    id: 'ps-cand-1',
    siteKey: 'photosplitstudio',
    domain: 'photosplitstudio.com',
    slotKey: 'sidebar',
    category: 'accessories',
    asin: 'B07G5SX4R1',
    title: 'Anker 2-in-1 USB-C Memory Card Reader (SDXC / microSD)',
    description: 'Transfer mirrorless camera shots directly to iPhone 15/16, iPad, or MacBook before splitting.',
    searchQuery: 'Anker USB C SD card reader high speed',
    priceEstimate: '$15.99',
    rating: 4.8,
    badge: 'Under $20',
    ctaText: 'Check Price on Amazon',
    status: 'candidate',
    impressions: 0,
    clicks: 0,
  },
  {
    id: 'ps-cand-2',
    siteKey: 'photosplitstudio',
    domain: 'photosplitstudio.com',
    slotKey: 'app-post-export',
    category: 'creator-lighting',
    asin: 'B0B5X3Y9Z2',
    title: 'Ulanzi VL49 RGB Mini Rechargeable Camera & Phone LED Video Light',
    description: 'Pocket-sized 360-degree RGB + bi-color magnetic fill light with 2000mAh battery for creators.',
    searchQuery: 'Ulanzi VL49 RGB LED video light camera smartphone',
    priceEstimate: '$24.95',
    rating: 4.7,
    badge: 'Pocket Light',
    ctaText: 'View on Amazon',
    status: 'candidate',
    impressions: 0,
    clicks: 0,
  },

  // ============================================================================
  // 3. IS-MY-INTERNET-WORKING.COM (Networking, Routers, Bufferbloat & Stability)
  // ============================================================================
  {
    id: 'imiw-active-1',
    siteKey: 'is-my-internet-working',
    domain: 'is-my-internet-working.com',
    slotKey: 'diagnostic-prescription',
    category: 'sqm-routers',
    asin: 'B0Ch8K9L2M',
    title: 'GL.iNet GL-MT6000 (Flint 2) Wi-Fi 6 Router with Native SQM / OpenWrt',
    description: 'Dual 2.5G ports and built-in CAKE/FQ_CoDel Smart Queue Management to eliminate bufferbloat and ping spikes.',
    searchQuery: 'GL.iNet GL-MT6000 Flint 2 WiFi 6 router OpenWrt SQM',
    priceEstimate: '$159.00',
    rating: 4.7,
    badge: 'Fixes Bufferbloat',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 780,
    clicks: 61,
  },
  {
    id: 'imiw-active-2',
    siteKey: 'is-my-internet-working',
    domain: 'is-my-internet-working.com',
    slotKey: 'network-upgrade-grid',
    category: 'mesh-wifi',
    asin: 'B096K9L3M1',
    title: 'TP-Link Deco AXE5400 Tri-Band Wi-Fi 6E Mesh System (3-Pack)',
    description: 'Covers up to 7,200 sq. ft. with a dedicated 6GHz backhaul band to eliminate dead zones and Wi-Fi drops.',
    searchQuery: 'TP-Link Deco AXE5400 Tri-Band WiFi 6E Mesh System',
    priceEstimate: '$249.99',
    rating: 4.7,
    badge: 'Best Whole-Home Mesh',
    ctaText: 'Shop on Amazon',
    status: 'active',
    impressions: 620,
    clicks: 44,
  },
  {
    id: 'imiw-active-3',
    siteKey: 'is-my-internet-working',
    domain: 'is-my-internet-working.com',
    slotKey: 'fix-guide-inline',
    category: 'cables-adapters',
    asin: 'B01N6P8R3T',
    title: 'Cable Matters Snagless 10Gbps Cat 6A Shielded Ethernet Cable (25 ft)',
    description: 'Bypass congested Wi-Fi channels completely for zero packet loss on gaming PCs, consoles, and work laptops.',
    searchQuery: 'Cat 6A shielded ethernet cable 25ft 10Gbps',
    priceEstimate: '$13.99',
    rating: 4.8,
    badge: 'Zero Packet Loss',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 540,
    clicks: 38,
  },
  {
    id: 'imiw-active-4',
    siteKey: 'is-my-internet-working',
    domain: 'is-my-internet-working.com',
    slotKey: 'status-outage-shelf',
    category: 'power-backup',
    asin: 'B07W8MCBMS',
    title: 'APC Back-UPS 600VA UPS Battery Backup for Wi-Fi Router & Modem',
    description: 'Keeps your fiber ONT, cable modem, and Wi-Fi router online for hours during power flickers and storms.',
    searchQuery: 'UPS battery backup for wifi router and modem APC',
    priceEstimate: '$64.99',
    rating: 4.7,
    badge: 'Outage Protection',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 460,
    clicks: 33,
  },
  {
    id: 'imiw-cand-1',
    siteKey: 'is-my-internet-working',
    domain: 'is-my-internet-working.com',
    slotKey: 'diagnostic-prescription',
    category: 'cables-adapters',
    asin: 'B08CK9X3Z1',
    title: 'Anker USB-C to 2.5Gbps Ethernet Adapter for MacBook & Windows',
    description: 'Instant wired multi-gigabit Ethernet port for modern USB-C/Thunderbolt laptops without RJ45 ports.',
    searchQuery: 'Anker USB C to 2.5Gbps ethernet adapter',
    priceEstimate: '$29.99',
    rating: 4.8,
    badge: 'Instant Wired Speed',
    ctaText: 'View on Amazon',
    status: 'candidate',
    impressions: 0,
    clicks: 0,
  },
  {
    id: 'imiw-cand-2',
    siteKey: 'is-my-internet-working',
    domain: 'is-my-internet-working.com',
    slotKey: 'network-upgrade-grid',
    category: 'modems',
    asin: 'B08F8M9K2L',
    title: 'ARRIS SURFboard S33 DOCSIS 3.1 Multi-Gigabit Cable Modem (2.5 Gbps)',
    description: 'Replace old ISP rental modems to stop puma-chipset latency spikes and save $168/year in rental fees.',
    searchQuery: 'ARRIS SURFboard S33 DOCSIS 3.1 cable modem 2.5 Gbps',
    priceEstimate: '$179.00',
    rating: 4.6,
    badge: 'Stop Rental Fees',
    ctaText: 'Check Price on Amazon',
    status: 'candidate',
    impressions: 0,
    clicks: 0,
  },

  // ============================================================================
  // 4. AUDIORAP.COM (Vocal/Beat Stem Extraction & Studio Production Gear)
  // ============================================================================
  {
    id: 'ar-active-1',
    siteKey: 'audiorap',
    domain: 'audiorap.com',
    slotKey: 'post-extraction',
    category: 'headphones',
    asin: 'B00HVLUR86',
    title: 'Audio-Technica ATH-M50x Professional Studio Monitor Headphones',
    description: 'Industry-standard 45mm large-aperture drivers for inspecting isolated vocal stems, reverb tails, and sub-bass.',
    searchQuery: 'Audio-Technica ATH-M50x professional studio monitor headphones',
    priceEstimate: '$149.00',
    rating: 4.8,
    badge: 'Studio Standard',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 490,
    clicks: 37,
  },
  {
    id: 'ar-active-2',
    siteKey: 'audiorap',
    domain: 'audiorap.com',
    slotKey: 'studio-showcase',
    category: 'interfaces',
    asin: 'B0C5M8L3K9',
    title: 'Focusrite Scarlett 2i2 (4th Gen) USB-C Audio Interface',
    description: '120dB dynamic range converters and Air mode preamps for recording clean vocals over extracted instrumentals.',
    searchQuery: 'Focusrite Scarlett 2i2 4th Gen USB audio interface',
    priceEstimate: '$199.99',
    rating: 4.8,
    badge: '#1 Interface',
    ctaText: 'Shop on Amazon',
    status: 'active',
    impressions: 420,
    clicks: 31,
  },
  {
    id: 'ar-active-3',
    siteKey: 'audiorap',
    domain: 'audiorap.com',
    slotKey: 'studio-showcase',
    category: 'microphones',
    asin: 'B0CTJ8R9M2',
    title: 'Shure MV7+ Podcast & Vocal Dynamic Microphone (USB-C & XLR)',
    description: 'Voice Isolation technology and built-in digital popper stopper for crisp rap & vocal takes in untreated rooms.',
    searchQuery: 'Shure MV7+ dynamic vocal microphone USB XLR',
    priceEstimate: '$279.00',
    rating: 4.8,
    badge: 'Pro Vocals',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 370,
    clicks: 26,
  },
  {
    id: 'ar-active-4',
    siteKey: 'audiorap',
    domain: 'audiorap.com',
    slotKey: 'studio-showcase',
    category: 'controllers',
    asin: 'B0886ZPWC8',
    title: 'Akai Professional MPK Mini MK3 25-Key USB MIDI Drum Pad Controller',
    description: '8 velocity-sensitive MPC drum pads for chopping extracted acapellas and flipping samples in any DAW.',
    searchQuery: 'Akai Professional MPK Mini MK3 MIDI controller',
    priceEstimate: '$99.00',
    rating: 4.7,
    badge: 'Beatmaker Pick',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 340,
    clicks: 24,
  },
  {
    id: 'ar-cand-1',
    siteKey: 'audiorap',
    domain: 'audiorap.com',
    slotKey: 'post-extraction',
    category: 'headphones',
    asin: 'B0011UB9CQ',
    title: 'Beyerdynamic DT 990 PRO 250 Ohm Open-Back Studio Headphones',
    description: 'Ultra-wide soundstage for surgical EQ, stem separation checks, and mastering reference.',
    searchQuery: 'Beyerdynamic DT 990 PRO open back studio headphones',
    priceEstimate: '$159.00',
    rating: 4.7,
    badge: 'Mastering Pick',
    ctaText: 'View on Amazon',
    status: 'candidate',
    impressions: 0,
    clicks: 0,
  },
  {
    id: 'ar-cand-2',
    siteKey: 'audiorap',
    domain: 'audiorap.com',
    slotKey: 'studio-showcase',
    category: 'monitors',
    asin: 'B075QVMBT9',
    title: 'PreSonus Eris 3.5 Studio Monitors (Pair) for Nearfield Mixing',
    description: '25W/side Class AB amplification and woven composite woofers for accurate beat mixing.',
    searchQuery: 'PreSonus Eris 3.5 studio monitors pair',
    priceEstimate: '$99.99',
    rating: 4.7,
    badge: 'Best Under $100',
    ctaText: 'Check Price on Amazon',
    status: 'candidate',
    impressions: 0,
    clicks: 0,
  },

  // ============================================================================
  // 5. TIKETICHAP.COM (Tanzania & East Africa Bus, SGR, Ferry & Safari Travel)
  // ============================================================================
  {
    id: 'tc-active-1',
    siteKey: 'tiketichap',
    domain: 'tiketichap.com',
    slotKey: 'route-essentials',
    category: 'power-charging',
    asin: 'B0C9CJK8M1',
    title: 'Anker 20,000mAh 30W Fast-Charge Portable Power Bank (Built-in USB-C Cable)',
    description: 'Essential for 8–14 hour Dar–Arusha/Mwanza buses and SGR trips—keeps your phone & e-tickets charged 4x over.',
    searchQuery: 'Anker 20000mAh power bank built in USB C cable travel',
    priceEstimate: '$35.99',
    rating: 4.8,
    badge: '#1 Bus & SGR Essential',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 580,
    clicks: 43,
  },
  {
    id: 'tc-active-2',
    siteKey: 'tiketichap',
    domain: 'tiketichap.com',
    slotKey: 'route-essentials',
    category: 'adapters',
    asin: 'B092J8K4L9',
    title: 'EPICKA Type G (Tanzania / Kenya / UK) Travel Plug Adapter with 4 USB Ports',
    description: 'Fits all 3-pin rectangular sockets in Dar es Salaam, Zanzibar, Arusha, and Nairobi hotels & SGR coaches.',
    searchQuery: 'Type G travel plug adapter Tanzania Kenya UK USB C',
    priceEstimate: '$14.99',
    rating: 4.8,
    badge: 'Fits TZ/KE Sockets',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 490,
    clicks: 35,
  },
  {
    id: 'tc-active-3',
    siteKey: 'tiketichap',
    domain: 'tiketichap.com',
    slotKey: 'destination-extras',
    category: 'safari-beach',
    asin: 'B07H8K9M2L',
    title: 'Vortex / Occer 12x42 Compact Waterproof Safari Binoculars with Phone Mount',
    description: 'High-contrast BAK4 prism optics for Serengeti, Ngorongoro Crater, Tarangire, and Mikumi game drives.',
    searchQuery: 'compact waterproof binoculars 12x42 safari wildlife travel',
    priceEstimate: '$36.99',
    rating: 4.6,
    badge: 'Safari Must-Have',
    ctaText: 'Shop on Amazon',
    status: 'active',
    impressions: 410,
    clicks: 29,
  },
  {
    id: 'tc-active-4',
    siteKey: 'tiketichap',
    domain: 'tiketichap.com',
    slotKey: 'home-travel-kit',
    category: 'safari-beach',
    asin: 'B0796R75GP',
    title: 'HEETA 20L Waterproof Dry Bag + IPX8 Floating Phone Pouch',
    description: 'Protects passports, cameras, and phones on Zanzibar/Pemba fast ferries, dhow cruises, and Nungwi beaches.',
    searchQuery: 'HEETA waterproof dry bag 20L with phone pouch boat ferry',
    priceEstimate: '$18.99',
    rating: 4.7,
    badge: 'Zanzibar Ferry Pick',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 360,
    clicks: 25,
  },
  {
    id: 'tc-cand-1',
    siteKey: 'tiketichap',
    domain: 'tiketichap.com',
    slotKey: 'route-essentials',
    category: 'comfort-audio',
    asin: 'B0B8L5K3M9',
    title: 'Soundcore by Anker Space A40 Auto-Adjustable Active Noise Cancelling Earbuds',
    description: '50-hour battery life and 98% road/engine noise reduction for peaceful overnight upcountry bus rides.',
    searchQuery: 'Soundcore Anker Space A40 noise cancelling earbuds travel',
    priceEstimate: '$59.00',
    rating: 4.6,
    badge: '50-Hr Bus Battery',
    ctaText: 'Check Price on Amazon',
    status: 'candidate',
    impressions: 0,
    clicks: 0,
  },
  {
    id: 'tc-cand-2',
    siteKey: 'tiketichap',
    domain: 'tiketichap.com',
    slotKey: 'home-travel-kit',
    category: 'comfort-audio',
    asin: 'B01N6M8R2P',
    title: 'Cabeau Evolution S3 Memory Foam Travel Neck Pillow with Seat Straps',
    description: 'Attaches to bus, SGR train, and economy flight headrests to stop head-bobbing on long East African routes.',
    searchQuery: 'Cabeau Evolution S3 travel neck pillow memory foam',
    priceEstimate: '$39.99',
    rating: 4.5,
    badge: 'Long-Haul Comfort',
    ctaText: 'View on Amazon',
    status: 'candidate',
    impressions: 0,
    clicks: 0,
  },

  // ============================================================================
  // 6. AKILIBRAIN.COM (Jobs, Tenders, Compliance, Salaries & Career Guides)
  // ============================================================================
  {
    id: 'ab-active-1',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'job-detail-sidebar',
    category: 'remote-work',
    asin: 'B096M8K4L2',
    title: 'Logitech Zone Vibe 100 Lightweight Wireless Headset with Noise-Cancelling Mic',
    description: 'Flip-to-mute beamforming microphone for crystal-clear Zoom/Teams job interviews and remote NGO/tech roles.',
    searchQuery: 'Logitech Zone Vibe 100 wireless headset noise cancelling microphone',
    priceEstimate: '$89.99',
    rating: 4.6,
    badge: 'Interview Ready',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 670,
    clicks: 49,
  },
  {
    id: 'ab-active-2',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'career-resources',
    category: 'career-books',
    asin: 'B08SBFTXQT',
    title: 'PMP Exam Prep Simplified (PMBOK 7th Edition + Agile Practice Guide)',
    description: 'Top-rated Project Management Professional certification guide required by UN, World Bank, and East African NGOs.',
    searchQuery: 'PMP Exam Prep Simplified PMBOK 7th Edition Andrew Ramdayal',
    priceEstimate: '$42.99',
    rating: 4.8,
    badge: '#1 Career Cert Book',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 590,
    clicks: 42,
  },
  {
    id: 'ab-active-3',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'tender-office-gear',
    category: 'tender-office',
    asin: 'B085M9K4L1',
    title: 'Brother ADS-1700W Compact Wireless Duplex Document Scanner',
    description: 'Fast 25ppm two-sided PDF scanning for digitizing tax clearance, BRELA/KRA certificates, and tender bid dossiers.',
    searchQuery: 'Brother ADS-1700W wireless duplex document scanner office',
    priceEstimate: '$229.99',
    rating: 4.6,
    badge: 'Tender Bid Essential',
    ctaText: 'Shop on Amazon',
    status: 'active',
    impressions: 440,
    clicks: 31,
  },
  {
    id: 'ab-active-4',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'guide-compliance-inline',
    category: 'remote-work',
    asin: 'B07DWM9WNM',
    title: 'Nulaxy Ergonomic Aluminum Laptop Stand + 1080p HD Webcam Kit',
    description: 'Elevates your camera to eye level for executive remote interviews, consultancy pitches, and compliance work.',
    searchQuery: 'ergonomic aluminum laptop stand desk remote work',
    priceEstimate: '$24.99',
    rating: 4.8,
    badge: 'Home Office Pick',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 410,
    clicks: 28,
  },
  {
    id: 'ab-cand-1',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'career-resources',
    category: 'career-books',
    asin: '1607741709',
    title: 'The 2-Hour Job Search & Cracking the Coding / Case Interview Bundle',
    description: 'Proven frameworks for landing interviews and negotiating top-quartile salaries.',
    searchQuery: 'The 2-Hour Job Search Steve Dalton career interview book',
    priceEstimate: '$17.99',
    rating: 4.7,
    badge: 'Salary Booster',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 380,
    clicks: 29,
  },
  {
    id: 'ab-cand-2',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'tender-office-gear',
    category: 'tender-office',
    asin: 'B079M8K3L1',
    title: 'FIDIC Contracts: Law and Practice (Construction & Public Procurement Reference)',
    description: 'Essential desk reference for East African civil engineering, infrastructure, and public procurement tenders.',
    searchQuery: 'FIDIC Contracts Law and Practice construction procurement book',
    priceEstimate: '$85.00',
    rating: 4.7,
    badge: 'Procurement Bible',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 350,
    clicks: 26,
  },
  {
    id: 'akil-4',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'job-detail-sidebar',
    category: 'webcams',
    asin: 'B006JH8T3S',
    title: 'Logitech C920x HD Pro Webcam 1080p with Stereo Audio',
    description: 'Industry-standard 1080p webcam with auto light correction for remote work consultations and video interviews.',
    searchQuery: 'Logitech C920x HD Pro Webcam 1080p',
    priceEstimate: '$59.99',
    rating: 4.7,
    badge: 'Remote Standard',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 420,
    clicks: 33,
  },
  {
    id: 'akil-5',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'job-detail-sidebar',
    category: 'audio',
    asin: 'B07Q379BCR',
    title: 'Jabra Speak 510 Wireless Bluetooth Speakerphone for Conferences',
    description: '360-degree omni-directional microphone for executive remote team calls and tender committee briefings.',
    searchQuery: 'Jabra Speak 510 wireless speakerphone conference',
    priceEstimate: '$119.00',
    rating: 4.7,
    badge: 'Exec Pick',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 390,
    clicks: 28,
  },
  {
    id: 'akil-6',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'career-resources',
    category: 'career-books',
    asin: 'B0832DC7JW',
    title: 'AWS Certified Solutions Architect Official Study Guide',
    description: 'Essential cloud architecture certification guide for high-paying international remote cloud roles.',
    searchQuery: 'AWS Certified Solutions Architect Associate Study Guide Ben Piper',
    priceEstimate: '$44.99',
    rating: 4.8,
    badge: 'Cloud High-Income',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 460,
    clicks: 36,
  },
  {
    id: 'akil-7',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'job-detail-sidebar',
    category: 'ergonomics',
    asin: 'B00008K4NN',
    title: '3M Ergonomic Optical Mouse with Joystick-Style Vertical Grip',
    description: 'Reduces wrist strain and carpal tunnel symptoms during 8-hour financial modeling and coding sessions.',
    searchQuery: '3M ergonomic vertical mouse optical',
    priceEstimate: '$64.99',
    rating: 4.6,
    badge: 'Ergonomic Choice',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 310,
    clicks: 22,
  },
  {
    id: 'akil-8',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'tender-office-gear',
    category: 'scanners',
    asin: 'B07G5X1N1H',
    title: 'Canon CanoScan LiDE 400 Slim Document & Tender Bid Scanner',
    description: 'High-speed 4800 dpi scanning for digitizing government tender submissions, tax clearances, and contracts.',
    searchQuery: 'Canon CanoScan LiDE 400 slim document scanner',
    priceEstimate: '$89.99',
    rating: 4.6,
    badge: 'Tender Essential',
    ctaText: 'Shop on Amazon',
    status: 'active',
    impressions: 380,
    clicks: 27,
  },
  {
    id: 'akil-9',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'tender-office-gear',
    category: 'storage',
    asin: 'B0CGW68L7V',
    title: 'Crucial X9 1TB Portable External SSD USB-C 1050MB/s',
    description: 'Rugged 1050MB/s encrypted-ready storage for securing client databases, audit backups, and compliance records.',
    searchQuery: 'Crucial X9 1TB Portable External SSD USB-C 1050MB/s',
    priceEstimate: '$109.99',
    rating: 4.7,
    badge: 'Audit Vault',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 340,
    clicks: 25,
  },
  {
    id: 'akil-10',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'career-resources',
    category: 'career-books',
    asin: 'B005315NW4',
    title: 'Cracking the Coding Interview 6th Edition (189 Programming Questions)',
    description: 'The canonical software engineering interview guide for international remote tech and fintech roles.',
    searchQuery: 'Cracking the Coding Interview 6th Edition Gayle Laakmann McDowell',
    priceEstimate: '$34.99',
    rating: 4.8,
    badge: 'Tech Interview Bible',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 510,
    clicks: 41,
  },
  {
    id: 'akil-11',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'job-detail-sidebar',
    category: 'keyboards',
    asin: 'B07S92QBCJ',
    title: 'Logitech MX Keys Advanced Wireless Illuminated Keyboard',
    description: 'Fluid tactile typing with smart backlighting and multi-device pairing for cross-platform engineers and analysts.',
    searchQuery: 'Logitech MX Keys advanced wireless keyboard',
    priceEstimate: '$109.99',
    rating: 4.7,
    badge: 'Dev Favorite',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 430,
    clicks: 34,
  },
  {
    id: 'akil-12',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'job-detail-sidebar',
    category: 'mice',
    asin: 'B07S395RWD',
    title: 'Logitech MX Master 3S Wireless Performance Mouse',
    description: '8K DPI sensor tracks on glass with quiet clicks and hyper-fast MagSpeed electromagnetic scrolling.',
    searchQuery: 'Logitech MX Master 3S wireless performance mouse',
    priceEstimate: '$99.99',
    rating: 4.8,
    badge: '#1 Pro Mouse',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 450,
    clicks: 37,
  },
  {
    id: 'akil-13',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'job-detail-sidebar',
    category: 'power',
    asin: 'B0962562R7',
    title: 'Anker 737 Power Bank (PowerCore 24K) 140W Fast Laptop Charger',
    description: 'Powers MacBooks, Dell XPS, and ThinkPads during office power cuts or fieldwork across East Africa.',
    searchQuery: 'Anker 737 power bank 24000mAh 140W fast charger',
    priceEstimate: '$129.99',
    rating: 4.8,
    badge: 'Laptop Backup',
    ctaText: 'Shop on Amazon',
    status: 'active',
    impressions: 490,
    clicks: 39,
  },
  {
    id: 'akil-14',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'career-resources',
    category: 'career-books',
    asin: 'B07N4M5R7T',
    title: 'Cisco CCNA 200-301 Official Cert Guide Library',
    description: 'Complete networking certification foundation for enterprise telecom, ISP, and systems engineers.',
    searchQuery: 'Cisco CCNA 200-301 Official Cert Guide Wendell Odom',
    priceEstimate: '$49.99',
    rating: 4.8,
    badge: 'Network Pro',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 360,
    clicks: 26,
  },
  {
    id: 'akil-15',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'job-detail-sidebar',
    category: 'monitors',
    asin: 'B08CVTTNN4',
    title: 'ASUS ZenScreen 15.6" Full HD Portable USB-C Monitor',
    description: 'Dual-screen productivity anywhere — slips into a laptop backpack for remote audit and consulting teams.',
    searchQuery: 'ASUS ZenScreen 15.6 inch portable monitor USB C',
    priceEstimate: '$149.00',
    rating: 4.6,
    badge: 'Mobile Dual Screen',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 410,
    clicks: 31,
  },
  {
    id: 'akil-16',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'job-detail-sidebar',
    category: 'lighting',
    asin: 'B0816G6H88',
    title: 'Neewer 2-Pack Dimmable 5600K USB LED Video Conference Lighting Kit',
    description: 'Soft non-glare daylight illumination ensuring professional video appearance during executive interviews.',
    searchQuery: 'Sensyne 10 inch LED key light for video conferencing',
    priceEstimate: '$29.99',
    rating: 4.6,
    badge: 'Pro Lighting',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 320,
    clicks: 23,
  },
  {
    id: 'akil-17',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'job-detail-sidebar',
    category: 'hubs',
    asin: 'B0874M3KW4',
    title: 'Anker 555 USB-C Hub (8-in-1 with 100W PD and 4K HDMI)',
    description: 'Connect monitors, gigabit ethernet, SD cards, and peripherals via a single USB-C port.',
    searchQuery: 'Anker 555 USB C hub 8 in 1 100W PD 4K HDMI',
    priceEstimate: '$45.99',
    rating: 4.7,
    badge: 'Desk Hub',
    ctaText: 'Shop on Amazon',
    status: 'active',
    impressions: 390,
    clicks: 29,
  },
  {
    id: 'akil-18',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'career-resources',
    category: 'career-books',
    asin: '1449373321',
    title: 'Designing Data-Intensive Applications by Martin Kleppmann',
    description: 'Definitive distributed systems guide required for senior data architecture and backend leadership.',
    searchQuery: 'Designing Data-Intensive Applications Martin Kleppmann',
    priceEstimate: '$39.99',
    rating: 4.9,
    badge: 'Data Bible',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 440,
    clicks: 35,
  },
  {
    id: 'akil-19',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'tender-office-gear',
    category: 'power',
    asin: 'B07VF78946',
    title: 'APC UPS 600VA Battery Backup & Surge Protector',
    description: 'Prevents unexpected shutdowns and data corruption on office workstations during grid voltage dips.',
    searchQuery: 'APC UPS 600VA battery backup surge protector',
    priceEstimate: '$76.99',
    rating: 4.7,
    badge: 'Power Defense',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 400,
    clicks: 30,
  },
  {
    id: 'akil-20',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'career-resources',
    category: 'career-books',
    asin: '1260464008',
    title: 'CompTIA Security+ Get Certified Get Ahead: SY0-701 Study Guide',
    description: 'Foundational cybersecurity credentials recognized by banks, governments, and international NGOs.',
    searchQuery: 'CompTIA Security+ SY0-701 certification guide',
    priceEstimate: '$38.99',
    rating: 4.8,
    badge: 'Cyber Defense',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 370,
    clicks: 28,
  },
  {
    id: 'akil-22',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'job-detail-sidebar',
    category: 'audio',
    asin: 'B0863TXGM3',
    title: 'Sony WH-1000XM4 Wireless Premium Noise-Canceling Headphones',
    description: 'Industry-best active noise cancelling for deep work in busy co-working spaces and open offices.',
    searchQuery: 'Sony WH-1000XM4 wireless noise canceling headphones',
    priceEstimate: '$248.00',
    rating: 4.8,
    badge: 'Deep Work Sound',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 480,
    clicks: 38,
  },
  {
    id: 'akil-23',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'career-resources',
    category: 'career-books',
    asin: '0132350882',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    description: 'Teaches software engineers to write readable, maintainable, and bug-free enterprise systems.',
    searchQuery: 'Clean Code Robert C Martin handbook agile',
    priceEstimate: '$32.99',
    rating: 4.8,
    badge: 'Engineering Classic',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 390,
    clicks: 30,
  },
  {
    id: 'akil-24',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'guide-compliance-inline',
    category: 'security',
    asin: 'B07HBD8X82',
    title: 'Yubico YubiKey 5 NFC Hardware Two-Factor Security Key',
    description: 'Unphishable hardware authentication shielding corporate compliance & tax portals from credential breaches.',
    searchQuery: 'Yubico YubiKey 5 NFC two factor authentication security key',
    priceEstimate: '$50.00',
    rating: 4.8,
    badge: 'Zero Trust Auth',
    ctaText: 'Shop on Amazon',
    status: 'active',
    impressions: 350,
    clicks: 27,
  },
  {
    id: 'akil-27',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'tender-office-gear',
    category: 'scanners',
    asin: 'B07KMN3XDF',
    title: 'Epson WorkForce ES-50 Portable Single-Sheet Mobile Document Scanner',
    description: 'Weighs under 0.6 lbs: instantly scan and OCR receipts, tax certificates, and contracts to PDF.',
    searchQuery: 'Epson WorkForce ES-50 portable document scanner',
    priceEstimate: '$99.99',
    rating: 4.7,
    badge: 'Field Audit OCR',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 360,
    clicks: 26,
  },
  {
    id: 'akil-28',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'tender-office-gear',
    category: 'printers',
    asin: 'B00K55B27Q',
    title: 'Brother HL-L2320D High-Speed Monochrome Laser Printer',
    description: 'Compact 30ppm duplex laser printer for fast tender bid dossier printing with low-cost toner.',
    searchQuery: 'Brother HL-L2320D monochrome laser printer compact',
    priceEstimate: '$119.99',
    rating: 4.6,
    badge: 'Tender Printer',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 340,
    clicks: 24,
  },
  {
    id: 'akil-32',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'career-resources',
    category: 'career-books',
    asin: 'B07ZDMK12N',
    title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
    description: 'Practical AI & ML reference used by data science leads across top East African fintechs and banks.',
    searchQuery: 'Hands-On Machine Learning Aurelien Geron O Reilly',
    priceEstimate: '$47.99',
    rating: 4.8,
    badge: 'AI/ML Blueprint',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 410,
    clicks: 32,
  },
  {
    id: 'akil-34',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'job-detail-sidebar',
    category: 'audio',
    asin: 'B082Y68Q8Q',
    title: 'Blue Yeti USB Microphone for Executive Calls & Webinars',
    description: 'Tri-capsule array delivers broadcast-quality voice clarity for board presentations and remote roles.',
    searchQuery: 'Blue Yeti USB microphone desktop podcasting',
    priceEstimate: '$99.99',
    rating: 4.7,
    badge: 'Broadcast Voice',
    ctaText: 'Check Price on Amazon',
    status: 'active',
    impressions: 370,
    clicks: 28,
  },
  {
    id: 'akil-35',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'career-resources',
    category: 'career-books',
    asin: 'B00IC8U57M',
    title: 'System Design Interview – An Insider\'s Guide by Alex Xu',
    description: 'The #1 guide for mastering distributed systems and cloud architecture technical interviews.',
    searchQuery: 'System Design Interview Alex Xu volume 1',
    priceEstimate: '$35.99',
    rating: 4.8,
    badge: 'System Design #1',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 430,
    clicks: 34,
  },
  {
    id: 'akil-36',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'job-detail-sidebar',
    category: 'power',
    asin: 'B09W2PNLX7',
    title: 'Anker Nano II 65W GaN Fast Laptop & Phone Charger Foldable',
    description: 'Replaces bulky laptop bricks with a pocket-sized ultra-fast GaN charger for MacBooks and USB-C laptops.',
    searchQuery: 'Anker 65W GaN fast charger foldable nano',
    priceEstimate: '$37.99',
    rating: 4.8,
    badge: 'Compact Power',
    ctaText: 'Shop on Amazon',
    status: 'active',
    impressions: 390,
    clicks: 30,
  },
  {
    id: 'akil-42',
    siteKey: 'akilibrain',
    domain: 'akilibrain.com',
    slotKey: 'guide-compliance-inline',
    category: 'privacy',
    asin: 'B07J53N4M8',
    title: 'SightPro 15.6" Laptop Privacy Screen Filter (Anti-Glare)',
    description: 'Limits viewing angles to +/- 30 degrees, protecting confidential tender bids and payroll data in public.',
    searchQuery: 'Laptop privacy screen filter 15.6 inch anti glare',
    priceEstimate: '$29.99',
    rating: 4.6,
    badge: 'Confidential Filter',
    ctaText: 'View on Amazon',
    status: 'active',
    impressions: 330,
    clicks: 25,
  },
];
