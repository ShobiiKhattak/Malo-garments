/*
 * Malo Garments — Categories Routes (Prisma)
 * GET / · POST / · PUT /:id · DELETE /:id
 */
import express from 'express';
import prisma from '../config/prisma';
import { generateId } from '../utils/id';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();
const slugify = (t: string) => String(t).toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');

/* GET /api/categories */
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { subcategories: true },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err: any) {
    console.error('GET /categories:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* POST /api/categories (admin) */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, image, subcategories = [], slug } = req.body;
    if (!name || !image)
      return res.status(400).json({ error: 'Name and image are required.' });

    const catId = generateId('cat');
    const catSlug = slug || slugify(name);

    const category = await prisma.category.create({
      data: {
        id: catId,
        name,
        slug: catSlug,
        image,
        subcategories: {
          create: subcategories.map((sub: any) => {
            const subName = typeof sub === 'string' ? sub : sub.name;
            return { id: generateId('sub'), name: subName, slug: slugify(subName) };
          }),
        },
      },
      include: { subcategories: true },
    });

    res.status(201).json({ success: true, id: category.id });
  } catch (err: any) {
    console.error('POST /categories:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* PUT /api/categories/:id (admin) */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Category not found.' });

    const { name, image, subcategories, slug } = req.body;
    const catSlug = slug || slugify(name);

    await prisma.category.update({
      where: { id: req.params.id },
      data: { name, slug: catSlug, image },
    });

    if (subcategories) {
      // Replace all subcategories
      await prisma.subcategory.deleteMany({ where: { category_id: req.params.id } });
      await prisma.subcategory.createMany({
        data: subcategories.map((sub: any) => {
          const subName = typeof sub === 'string' ? sub : sub.name;
          return { id: generateId('sub'), category_id: req.params.id, name: subName, slug: slugify(subName) };
        }),
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('PUT /categories/:id:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* DELETE /api/categories/:id (admin) */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const categoryId = String(req.params.id || '').trim();

    // 1. Security: Input validation
    if (!categoryId) {
      return res.status(400).json({ error: 'Valid Category ID is required.' });
    }

    // 2. Security: Verify category exists before performing delete operations
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // 3. Security: Atomic Database Transaction (ACID)
    // Agar beech mein koi issue aaye to data corrupt nahi hoga (rollback ho jayega)
    await prisma.$transaction(async (tx) => {
      // Step A: Is category ya iske subcategories se linked saare products delete karein
      await tx.product.deleteMany({
        where: {
          OR: [
            { category_id: categoryId },
            { subcategory: { category_id: categoryId } },
          ],
        },
      });

      // Step B: Category delete karein (iski subcategories Prisma cascade se delete hongi)
      await tx.category.delete({
        where: { id: categoryId },
      });
    });

    res.json({
      success: true,
      message: `Category "${category.name}" and its associated products were deleted successfully.`,
    });
  } catch (err: any) {
    console.error('DELETE /categories/:id error:', err);
    res.status(500).json({ error: 'Failed to delete category securely.' });
  }
});

export default router;
