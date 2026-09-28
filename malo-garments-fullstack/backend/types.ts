/*
 * Malo Garments — Shared Backend Types
 */

// ─── Seed data shape (backend/data/seed-data.ts) ───────────────────────────────
export interface SeedColor {
  name: string;
  hex: string;
}

export interface SeedSubcategory {
  id: string;
  name: string;
  slug: string;
}

export interface SeedCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  subcategories: SeedSubcategory[];
}

export interface SeedProduct {
  id: string;
  name: string;
  price: number;
  original_price: number;
  category_id: string;
  subcategory_id?: string;
  sizes: string[];
  colors: SeedColor[];
  stock: number;
  images: string[];
  description: string;
  rating: number;
  reviews: number;
  date_added: string;
  featured: boolean;
  on_sale: boolean;
}

export interface SeedData {
  admin: { username: string; password: string; name: string };
  categories: SeedCategory[];
  products: SeedProduct[];
}

// ─── Auth session payloads (JWT contents) ──────────────────────────────────────
export interface CustomerSession {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface AdminSession {
  id: string;
  username: string;
  name: string;
}

// ─── Express Request augmentation ──────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: CustomerSession;
      admin?: AdminSession;
    }
  }
}
