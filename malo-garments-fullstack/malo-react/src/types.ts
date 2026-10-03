/*
 * Malo Garments — Shared Frontend Types
 */

export interface Color {
  name: string;
  hex: string;
}

export interface Subcategory {
  id: string;
  category_id?: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  subcategories?: Subcategory[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number;
  category_id: string;
  subcategory_id?: string | null;
  sizes: string[];
  colors: Color[];
  stock: number;
  images: string[];
  description: string;
  rating: number;
  reviews: number;
  date_added?: string;
  featured: boolean;
  on_sale: boolean;
  /** Dropshipping — only returned to the admin */
  is_dropship?: boolean;
  supplier_name?: string | null;
  supplier_phone?: string | null;
  supplier_url?: string | null;
  supplier_sku?: string | null;
  supplier_price?: number | null;
}

export interface CartItem {
  productId: string | null;
  name: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  /** Set for items made in the Design Studio — server prices these from
   *  its pricing table (base + options) instead of looking up a real Product row. */
  customType?: 'dress' | 'bra' | 'underwear' | 'nighty';
  /** The options picked in the Design Studio; the server re-prices from these. */
  customization?: { color: string; pattern: string; styles: Record<string, string>; size: string };
  /** Filled in from the live catalogue by the cart sync. */
  originalPrice?: number;
  stock?: number;
}

export interface Address {
  id?: string;
  user_id?: string;
  label?: string;
  phone?: string;
  street: string;
  city: string;
  state?: string;
  zip?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  addresses?: Address[];
}

export interface Admin {
  id: string;
  username: string;
  name: string;
}

export interface OrderItem {
  id?: number;
  product_id?: string;
  name: string;
  image: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;
  /** Dropship supplier snapshot — only returned to the admin */
  is_dropship?: boolean;
  cost_price?: number | null;
  supplier_name?: string | null;
  supplier_phone?: string | null;
  supplier_url?: string | null;
  supplier_sku?: string | null;
}

export interface OrderCustomer {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface Order {
  id: string;
  subtotal: number;
  shipping: number;
  discount?: number;
  total: number;
  status: string;
  payment_method?: string;
  /** not_required (COD) | awaiting | submitted | confirmed | rejected */
  payment_status?: string;
  payment_ref?: string | null;
  payment_submitted_at?: string | null;
  payment_confirmed_at?: string | null;
  /** Dropshipping (admin only): placed with supplier / shipped by supplier */
  supplier_status?: 'placed' | 'shipped' | null;
  supplier_ref?: string | null;
  supplier_sent_at?: string | null;
  paymentMethod?: string;
  created_at?: string;
  createdAt?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  customer?: OrderCustomer;
  items?: OrderItem[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  date_joined?: string;
  orderCount?: number;
  totalSpent?: number;
}

export interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  deliveredRevenue: number;
  monthlyRevenue: { label: string; revenue: number }[];
  productsByCategory: { name: string; count: number }[];
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  sale?: boolean;
  featured?: boolean;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  sort?: string;
  /** admin pages: ask for supplier details too (needs the admin token) */
  admin?: boolean;
}
