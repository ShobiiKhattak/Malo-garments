import { useQuery } from '@tanstack/react-query'
import { getCategories } from '../services/api'
import type { Category, Subcategory } from '../types'

const EMPTY: Category[] = []

/** Shared, cached category list (same query key everywhere). */
export function useCategories() {
  const { data = EMPTY, isLoading } = useQuery({ queryKey: ['categories'], queryFn: getCategories, staleTime: 1000 * 20 })
  return { categories: data, isLoading }
}

/** Direct link to a category / subcategory page. Uses slugs so links survive a re-seeded database. */
export const categoryLink = (cat: Pick<Category, 'slug'>, sub?: Pick<Subcategory, 'slug'>) =>
  `/shop?category=${cat.slug}${sub ? `&subcategory=${sub.slug}` : ''}`

/** A URL param may hold an id (old links) or a slug (new links). */
export const findCategory = (cats: Category[], key: string) =>
  key ? cats.find(c => c.id === key || c.slug === key) : undefined
export const findSubcategory = (cat: Category | undefined, key: string) =>
  key ? cat?.subcategories?.find(s => s.id === key || s.slug === key) : undefined
