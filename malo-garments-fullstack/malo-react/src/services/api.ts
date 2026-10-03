import axios from 'axios'
import type { Product, Category, User, Order, AdminStats, Customer, Address, ProductFilters } from '../types'

// Which backend to talk to:
//  • VITE_API_URL set (e.g. on Netlify) → that backend
//  • `npm run dev` on this laptop       → the local backend (Vite proxies /api to port 3001)
//  • production build without the var   → the Railway backend
const API_BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'https://malo-garments-production.up.railway.app')
const API = axios.create({ baseURL: `${API_BASE_URL}/api` })

/* Routes the backend guards with authenticateAdmin. Everything else is a customer request,
 * so an admin logged in on the same browser never hijacks the customer's orders/account. */
const isAdminRequest = (method = 'get', url = '') => {
  const m = method.toLowerCase()
  const path = url.split('?')[0]
  return path.startsWith('/admin')
    || (m === 'get' && path === '/orders')
    || (m === 'patch' && /^\/orders\/[^/]+\/(status|payment)$/.test(path))
    || (m !== 'get' && /^\/(products|categories)(\/|$)/.test(path))
}

// Attach the right token automatically
API.interceptors.request.use((config) => {
  const token = isAdminRequest(config.method, config.url)
    ? localStorage.getItem('malo_admin_token')
    : localStorage.getItem('malo_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Products ───────────────────────────────────────────
export const getProducts = (filters: ProductFilters = {}): Promise<Product[]> => {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.subcategory) params.set('subcategory', filters.subcategory)
  if (filters.sale) params.set('sale', 'true')
  if (filters.featured) params.set('featured', 'true')
  if (filters.q) params.set('q', filters.q)
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice))
  if (filters.size) params.set('size', filters.size)
  if (filters.sort) params.set('sort', filters.sort)
  return API.get(`/products?${params}`).then(r => r.data)
}

export const getProductById = (id: string): Promise<Product> => API.get(`/products/${id}`).then(r => r.data)

export const createProduct = (data: Partial<Product>) => API.post('/products', data).then(r => r.data)
export const updateProduct = (id: string, data: Partial<Product>) => API.put(`/products/${id}`, data).then(r => r.data)
export const deleteProduct = (id: string) => API.delete(`/products/${id}`).then(r => r.data)

// ─── Categories ─────────────────────────────────────────
export const getCategories = (): Promise<Category[]> => API.get('/categories').then(r => r.data)
export const createCategory = (data: Partial<Category>) => API.post('/categories', data).then(r => r.data)
export const updateCategory = (id: string, data: Partial<Category>) => API.put(`/categories/${id}`, data).then(r => r.data)
export const deleteCategory = (id: string) => API.delete(`/categories/${id}`).then(r => r.data)

// ─── Auth ────────────────────────────────────────────────
export const registerUser = (data: { name: string; email: string; phone?: string; password: string }) =>
  API.post('/auth/register', data).then(r => r.data)
export const loginUser = (data: { email: string; password: string }) =>
  API.post('/auth/login', data).then(r => r.data)
export const sendOtp = (phone: string) =>
  API.post('/auth/otp/send', { phone }).then(r => r.data)
export const verifyOtp = (data: { phone: string; code: string; name?: string }) =>
  API.post('/auth/otp/verify', data).then(r => r.data)
export const googleLogin = (credential: string) =>
  API.post('/auth/google', { credential }).then(r => r.data)

// ─── AI Size Assistant ────────────────────────────────────
export interface SizeRecommendation { size: string; note: string; source: 'ai' | 'rule' }
export const getSizeRecommendation = (data: {
  productName: string; category: string; subcategory: string; sizes: string[];
  measurements: { bust?: number; waist?: number; hip?: number; underbust?: number };
}): Promise<SizeRecommendation> => API.post('/ai/size-recommendation', data).then(r => r.data)

export const generateDesignPreview = (data: {
  garmentType: string; color: string; pattern: string; styleSummary: string;
}): Promise<{ image: string }> => API.post('/ai/design-preview', data).then(r => r.data)
export const getMe = (): Promise<User> => API.get('/auth/me').then(r => r.data)
export const updateMe = (data: Partial<User>) => API.put('/auth/me', data).then(r => r.data)
export const addAddress = (data: Partial<Address>) => API.post('/auth/me/addresses', data).then(r => r.data)

// ─── Orders ─────────────────────────────────────────────
export interface DesignPricing {
  base: number
  patterns: Record<string, number>
  styles: Record<string, Record<string, number>>
  sizes: Record<string, number>
  colors: Record<string, number>
}
export const getDesignPricing = (): Promise<Record<string, DesignPricing>> => API.get('/design/pricing').then(r => r.data)
export const placeOrder = (data: any): Promise<{ id: string; discount?: number; total?: number }> => API.post('/orders', data).then(r => r.data)
export const getMyOrders = (): Promise<Order[]> => API.get('/orders/mine').then(r => r.data)
/** Removes a delivered/cancelled order from the customer's own list (the store keeps it). */
export const removeMyOrder = (id: string) => API.delete(`/orders/${id}`).then(r => r.data)
export const getOrderById = (id: string): Promise<Order> => API.get(`/orders/${id}`).then(r => r.data)
export const getAllOrders = (): Promise<Order[]> => API.get('/orders').then(r => r.data)
export const submitOnlinePayment = (id: string, data: { email: string; reference: string }) =>
  API.post(`/orders/${id}/payment`, data).then(r => r.data as { success: boolean; payment_status: string })
export const decideOnlinePayment = (id: string, action: 'confirm' | 'reject') =>
  API.patch(`/orders/${id}/payment`, { action }).then(r => r.data)
export const updateOrderStatus = (id: string, status: string) => API.patch(`/orders/${id}/status`, { status }).then(r => r.data)

// ─── Payments ─────────────────────────────────────────────
export const initiatePayment = (payload: any) => API.post('/payments/initiate', payload).then(r => r.data)

// ─── Admin ───────────────────────────────────────────────
export interface AdminAccount { id: string; username: string; name: string; email: string | null }
export const getAdminMe = (): Promise<AdminAccount> => API.get('/admin/me').then(r => r.data)
export const updateAdminMe = (data: { currentPassword: string; name?: string; email?: string; newPassword?: string }): Promise<{ success: boolean; admin: AdminAccount; passwordChanged: boolean }> =>
  API.put('/admin/me', data).then(r => r.data)
export const adminLogin = (data: { username: string; password: string }) =>
  API.post('/admin/login', data).then(r => r.data)
export const getAdminStats = (): Promise<AdminStats> => API.get('/admin/stats').then(r => r.data)
export const getCustomers = (): Promise<Customer[]> => API.get('/admin/customers').then(r => r.data)

// ─── Newsletter ──────────────────────────────────────────
export const subscribeNewsletter = (email: string) => API.post('/newsletter', { email }).then(r => r.data)
export const sendContactMessage = (data: { name: string; email: string; phone?: string; subject?: string; message: string }) => API.post('/contact', data).then(r => r.data)

export default API
