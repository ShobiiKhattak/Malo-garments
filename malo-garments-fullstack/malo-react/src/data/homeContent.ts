/*
 * ─────────────────────────────────────────────────────────────────────────
 *  HOME PAGE CONTENT  —  yahan se poori homepage control hoti hai
 * ─────────────────────────────────────────────────────────────────────────
 *  • Har `img` / `poster` / `video` field khali ('') ho sakta hai — tab
 *    ek khoobsurat gradient placeholder nazar aata hai.
 *  • Apni image lagane ke liye file ko `public/images/home/` mein rakhein
 *    aur yahan likhein:  img: '/images/home/pj-sets.jpg'
 *    (ya koi bhi full https:// URL).
 *  • `to` = jis page par click karne se jana hai. Category links slug se
 *    banti hain:  /shop?category=nightwear&subcategory=pajama-sets
 *    (slugs Admin > Categories mein dikhte hain).
 * ─────────────────────────────────────────────────────────────────────────
 */
import { getCurrentSeason } from '../utils/season'

/* ── Store info (footer + WhatsApp button) ───────────────────────────── */
export const STORE = {
  name: 'Malo Garments',
  whatsapp: '923322268785', // country code ke saath, + ke baghair
  whatsappMessage: 'Hi Malo Garments! I need some help.',
  phone: '+92 3322268785',
  // landline: '021-00000000',
  address: 'Rawalpindi ',
  email: 'support@malogarments.com',
  hours: 'Mon – Sat: 10:00 AM – 9:00 PM',
  social: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    tiktok: 'https://tiktok.com/',
  },
}

/* ── Top announcement bar ────────────────────────────────────────────── */
export const ANNOUNCEMENTS = [
  { text: 'BUY 2 GET 5% OFF EXTRA', code: 'MALO205' },
  { text: 'BUY 4 GET 10% OFF EXTRA', code: 'MALO410' },
  { text: 'BUY 6 GET 15% OFF EXTRA', code: 'MALO615' },
]

/* ── Special menu links. Category links are built from the database automatically. ── */
export const SPECIAL_LINKS = [
  { label: 'New Arrivals', to: '/shop?sort=newest' },
  { label: 'Sale', to: '/shop?sale=true' },
]

/* ── Slim scrolling strip under the hero ─────────────────────────────── */
export const MARQUEE = [
  'Free delivery above Rs. 5,000',
  'Cash on delivery available',
  'Easy 7-day exchange',
  'Discreet packaging',
  'Premium fabrics',
]

/* ── Hero slider ─────────────────────────────────────────────────────── */
// Pehli slide mausam ke hisaab se khud badalti hai (winter / summer).
const SEASON_SLIDE = {
  winter: {
    img: 'https://images.unsplash.com/photo-1764179690247-df7f4014def7?w=1600&h=1200&fit=crop&crop=faces,top&auto=format',
    tag: 'Winter Collection',
    title: 'Winterwear',
    desc: 'Cozy layers and warm sleepwear — comfort meets timeless elegance.',
  },
  summer: {
    img: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1600&h=1200&fit=crop&crop=faces,top&auto=format',
    tag: 'Summer Collection',
    title: 'Summer Edit',
    desc: 'Breathable fabrics and effortless silhouettes for the sunniest days.',
  },
}

export interface HeroSlide {
  img: string
  tag: string
  title: string
  desc: string
  cta: string
  to: string
  tone: number // placeholder gradient (0-5) jab image na ho
}

export const HERO_SLIDES: HeroSlide[] = [
  { ...SEASON_SLIDE[getCurrentSeason()], cta: 'Shop Now', to: '/shop', tone: 0 },
  {
    img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&h=1200&fit=crop&auto=format',
    tag: 'Intimate Luxury',
    title: 'Sleepwear',
    desc: 'Where comfort meets style — PJ sets you will never want to take off.',
    cta: 'Shop PJ Sets',
    to: '/shop?category=nightwear',
    tone: 2,
  },
  {
    img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&h=1200&fit=crop&auto=format',
    tag: 'Limited Time',
    title: 'Up to 40% Off',
    desc: 'Our seasonal sale is live. Premium quality at unbeatable prices.',
    cta: 'Shop Sale',
    to: '/shop?sale=true',
    tone: 3,
  },
]

/* ── Category sections on the home page ──────────────────────────────────
 * One banner + tiles is generated automatically for EVERY category (and its
 * subcategories) that you create in Admin → Categories, so the store always
 * matches the admin. Photos come from the category photo / the first product.
 *
 * Optional: customise a section by category slug. Everything is optional.
 */
export interface Tile { title: string; img: string; to: string; tone: number }
export interface ShowcaseOverride {
  title?: string                      // big banner text (default: category name)
  sub?: string                        // small line under it
  img?: string                        // banner photo (default: category photo)
  style?: 'italic' | 'caps'
  tiles?: Record<string, { title?: string; img?: string }>   // key = subcategory slug
}
export const SHOWCASE_OVERRIDES: Record<string, ShowcaseOverride> = {
  nightwear: { title: 'PJ Sets', sub: 'Where comfort meets style', style: 'italic' },
  bras: { sub: "Support you can feel, comfort you'll love", style: 'caps' },
  undergarments: { sub: 'All-day comfort, no compromise' },
  shapewear: { title: 'Bodyshapers', sub: 'Invisible support under every outfit', style: 'caps' },
  lingerie: { sub: 'Make your moments memorable', style: 'caps' },
}
export const SHOWCASE_MAX_TILES = 4

// Link helper: /shop?category=<slug>&subcategory=<slug>
const L = (cat: string, sub?: string) => `/shop?category=${cat}${sub ? `&subcategory=${sub}` : ''}`

/* ── Bundles (two big tiles) ─────────────────────────────────────────────
 * Photos come automatically from matching products (`match`). To use your own photos
 * instead, fill `imgs` with up to 3 image URLs, e.g. imgs: ['/banners/bundle-1.jpg']. */
export const BUNDLES: {
  title: string; cta: string; to: string; bg: string; ink: string
  match: (p: { price: number; on_sale?: boolean }) => boolean
  imgs?: string[]
}[] = [
  { title: 'Value Bundles', cta: 'Shop Now', to: '/shop?sale=true', bg: '#f7b5d3', ink: '#d81b74', match: p => !!p.on_sale },
  { title: 'Everything Under 999', cta: 'Shop Now', to: '/shop?maxPrice=999', bg: '#e6d8f5', ink: '#1f2a6b', match: p => p.price <= 999 },
]

/* ── Tops / Bottoms / Accessories (horizontal scroll) ────────────────── */
/* ── Helper tools (two pastel cards) ─────────────────────────────────── */
export const TOOLS = [
  { title: 'Bra Size Calculator', hint: 'Find your perfect fit', to: '/shop?category=bras', bg: '#fde3e6', icon: 'ruler' as const },
  { title: 'Period Tracker', hint: 'Track your cycle easily', to: '/contact', bg: '#e3ecfb', icon: 'calendar' as const },
]

/* ── Watch & Buy (short videos). video = mp4 URL ya '/videos/x.mp4' ──── */
export interface VideoItem {
  video: string
  poster: string
  name: string
  price: number
  oldPrice: number
  to: string
  tone: number
}

export const VIDEOS: VideoItem[] = [
  { video: '', poster: '', name: 'Linen Pajama Suit — Maroon', price: 2999, oldPrice: 3999, to: L('nightwear'), tone: 4 },
  { video: '', poster: '', name: 'Bodysuit — Classic Black', price: 1899, oldPrice: 2499, to: L('lingerie', 'bodysuits'), tone: 0 },
  { video: '', poster: '', name: 'Silk Robe Set — Rose', price: 3499, oldPrice: 4599, to: L('nightwear', 'robes'), tone: 5 },
  { video: '', poster: '', name: 'Seamless Bra Set — Nude', price: 2199, oldPrice: 2899, to: L('lingerie', 'lingerie-sets'), tone: 2 },
  { video: '', poster: '', name: 'Fleece Lounge Set', price: 3399, oldPrice: 4499, to: L('nightwear', 'night-suits'), tone: 3 },
]

/* ── Customer love ───────────────────────────────────────────────────── */
export const TESTIMONIALS = [
  { name: 'Ayesha R.', role: 'Loyal Customer', text: "The quality of the fabrics is exceptional. Every piece I've ordered has exceeded my expectations." },
  { name: 'Fatima K.', role: 'Verified Buyer', text: "Finally found a brand that understands comfort AND style. Their undergarments are the softest I've ever worn." },
  { name: 'Sara M.', role: 'Repeat Customer', text: 'Beautiful packaging, fast delivery, and the set looked even better in person. Highly recommend!' },
]
