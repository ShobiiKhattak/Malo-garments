/*
 * ══════════════════════════════════════════════════════════════
 * Malo Garments — Database Seeder (Prisma ORM)
 * ══════════════════════════════════════════════════════════════
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from './config/prisma';
import type { Prisma } from '@prisma/client';
import { MALO_SEED } from './data/seed-data';

async function seed() {
  // The demo catalogue is only created on the very first start (no admin account yet).
  // After that the database belongs to the store owner: edits made in the admin panel
  // (category names/photos, deleted or new products) must survive container restarts.
  const firstRun = (await prisma.adminUser.count()) === 0;
  if (!firstRun) console.log('Existing database found — skipping demo catalogue.');

  console.log('Seeding categories & subcategories...');
  for (const cat of firstRun ? MALO_SEED.categories : []) {
    const existingCat = await prisma.category.findUnique({ where: { slug: cat.slug } });
    const categoryRecord = existingCat
      ? await prisma.category.update({
          where: { id: existingCat.id },
          data: { name: cat.name, image: cat.image },
        })
      : await prisma.category.create({
          data: { id: cat.id, name: cat.name, slug: cat.slug, image: cat.image },
        });

    for (const sub of cat.subcategories || []) {
      const existingSub = await prisma.subcategory.findFirst({
        where: { slug: sub.slug, category_id: categoryRecord.id },
      });

      if (existingSub) {
        await prisma.subcategory.update({
          where: { id: existingSub.id },
          data: { name: sub.name },
        });
      } else {
        await prisma.subcategory.create({
          data: {
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            category_id: categoryRecord.id,
          },
        });
      }
    }
  }

  console.log(`Seeding ${firstRun ? MALO_SEED.products.length : 0} products...`);
  for (const p of firstRun ? MALO_SEED.products : []) {
    const existingProd = await prisma.product.findUnique({ where: { id: p.id } });
    if (existingProd) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          name: p.name,
          price: p.price,
          original_price: p.original_price,
          category_id: p.category_id,
          subcategory_id: p.subcategory_id || null,
          sizes: p.sizes || [],
          colors: (p.colors || []) as unknown as Prisma.InputJsonValue,
          stock: p.stock,
          images: p.images || [],
          description: p.description,
          rating: p.rating,
          reviews: p.reviews,
          date_added: p.date_added ? new Date(p.date_added) : null,
          featured: !!p.featured,
          on_sale: !!p.on_sale,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          id: p.id,
          name: p.name,
          price: p.price,
          original_price: p.original_price,
          category_id: p.category_id,
          subcategory_id: p.subcategory_id || null,
          sizes: p.sizes || [],
          colors: (p.colors || []) as unknown as Prisma.InputJsonValue,
          stock: p.stock,
          images: p.images || [],
          description: p.description,
          rating: p.rating,
          reviews: p.reviews,
          date_added: p.date_added ? new Date(p.date_added) : null,
          featured: !!p.featured,
          on_sale: !!p.on_sale,
        },
      });
    }
  }

  // The admin account is created ONCE. After that its password belongs to the store owner
  // (changed in Admin → Account settings) and is never reset on restart.
  if (firstRun) {
    console.log('Creating the first admin account...');
    await prisma.adminUser.create({
      data: {
        id: 'admin-1',
        username: MALO_SEED.admin.username,
        password_hash: await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD || MALO_SEED.admin.password, 10),
        name: MALO_SEED.admin.name,
      },
    });
    console.log('✓ First admin created (username: %s) — change the password in Admin → Account settings.', MALO_SEED.admin.username);
  } else {
    console.log('Admin account exists — leaving its password untouched.');
  }

  console.log('✓ Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
