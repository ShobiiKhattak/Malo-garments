/*
 * Malo Garments — Products Routes (Prisma)
 * GET / · GET /:id · POST / · PUT /:id · DELETE /:id
 */
import express from 'express';
import prisma from '../config/prisma';
import { generateId } from '../utils/id';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

/* Helper — normalise Prisma product to frontend shape */
const normalise = (p: any) => ({
  ...p,
  price:          Number(p.price),
  original_price: Number(p.original_price),
  rating:         Number(p.rating),
  featured:       Boolean(p.featured),
  on_sale:        Boolean(p.on_sale),
  sizes:  p.sizes  ?? [],
  colors: p.colors ?? [],
  images: p.images ?? [],
});

/* GET /api/products */
router.get('/', async (req, res) => {
  try {
    const { category, subcategory, sale, featured, q, minPrice, maxPrice, size, sort } = req.query as Record<string, string | undefined>;

    const where: any = {};
    if (category)    where.category_id    = category;
    if (subcategory) where.subcategory_id = subcategory;
    if (sale === 'true')     where.on_sale  = true;
    if (featured === 'true') where.featured = true;
    if (q) {
      where.OR = [
        { name:        { contains: q } },
        { description: { contains: q } },
      ];
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    // Size filter (JSON column — use raw for compatibility)
    const orderBy: any = sort === 'price-asc'  ? { price: 'asc' }
      : sort === 'price-desc' ? { price: 'desc' }
      : sort === 'newest'     ? { date_added: 'desc' }
      : sort === 'name-asc'   ? { name: 'asc' }
      : sort === 'rating'     ? { rating: 'desc' }
      : [{ featured: 'desc' }, { date_added: 'desc' }];

    // Sort only the ids, then load full rows: sorting whole rows with big base64 images
    // overflows MySQL's sort buffer ("Out of sort memory") and the whole list fails.
    const ids = (await prisma.product.findMany({ where, orderBy, select: { id: true } })).map((p) => p.id);
    const rows = await prisma.product.findMany({ where: { id: { in: ids } } });
    const byId = new Map(rows.map((p) => [p.id, p]));
    let products = ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);

    // Size filter post-query (JSON array)
    if (size) {
      products = products.filter((p) => {
        const sizes = p.sizes ?? [];
        return Array.isArray(sizes) && sizes.includes(size);
      });
    }

    res.json(products.map(normalise));
  } catch (err: any) {
    console.error('GET /products:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* GET /api/products/:id */
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(normalise(product));
  } catch (err: any) {
    console.error('GET /products/:id:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* POST /api/products (admin) */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, price, category_id, original_price, subcategory_id, sizes, colors, images, stock, description, featured, on_sale } = req.body;
    if (!name || !price || !category_id)
      return res.status(400).json({ error: 'name, price and category_id are required.' });

    const product = await prisma.product.create({
      data: {
        id:             generateId('prod'),
        name,
        price:          Number(price),
        original_price: Number(original_price || price),
        category_id,
        subcategory_id: subcategory_id || null,
        sizes:          sizes   ?? [],
        colors:         colors  ?? [],
        images:         images  ?? [],
        stock:          Number(stock) || 0,
        description:    description || null,
        featured:       Boolean(featured),
        // a higher original price means the product is on sale (keeps the Sale filter + badges consistent)
        on_sale:        Boolean(on_sale) || Number(original_price || price) > Number(price),
        date_added:     new Date(),
      },
    });
    res.status(201).json({ success: true, id: product.id });
  } catch (err: any) {
    console.error('POST /products:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* PUT /api/products/:id (admin) */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Product not found.' });

    const { name, price, original_price, category_id, subcategory_id, sizes, colors, images, stock, description, featured, on_sale } = req.body;

    await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name:            name ?? existing.name,
        price:           price !== undefined ? Number(price) : existing.price,
        original_price:  original_price !== undefined ? Number(original_price) : (price !== undefined ? Number(price) : existing.original_price),
        category_id:     category_id ?? existing.category_id,
        subcategory_id:  subcategory_id !== undefined ? (subcategory_id || null) : existing.subcategory_id,
        sizes:           sizes   ?? existing.sizes,
        colors:          colors  ?? existing.colors,
        images:          images  ?? existing.images,
        stock:           stock !== undefined ? Number(stock) : existing.stock,
        description:     description ?? existing.description,
        featured:        featured !== undefined ? Boolean(featured) : existing.featured,
        on_sale:         (on_sale !== undefined ? Boolean(on_sale) : existing.on_sale)
                         || (original_price !== undefined && price !== undefined && Number(original_price) > Number(price)),
      },
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('PUT /products/:id:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* DELETE /api/products/:id (admin) */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /products/:id:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

export default router;
