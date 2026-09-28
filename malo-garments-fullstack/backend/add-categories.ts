import prisma from './config/prisma';
import { MALO_SEED } from './data/seed-data';
import { generateId } from './utils/id';

async function main() {
  console.log('Syncing categories and exact subcategories to database...');
  
  for (const cat of MALO_SEED.categories) {
    let category = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!category) {
      category = await prisma.category.create({
        data: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.image,
        },
      });
      console.log(`Created Category: ${cat.name}`);
    } else {
      category = await prisma.category.update({
        where: { id: category.id },
        data: { name: cat.name, image: cat.image },
      });
      console.log(`Updated Category: ${cat.name}`);
    }

    // Clear and re-create subcategories for this category to ensure exact match
    await prisma.subcategory.deleteMany({ where: { category_id: category.id } });
    
    for (const sub of cat.subcategories || []) {
      const subId = generateId('sub');
      await prisma.subcategory.create({
        data: {
          id: subId,
          name: sub.name,
          slug: sub.slug,
          category_id: category.id,
        },
      });
      console.log(`  + Added Subcategory: ${sub.name} (${sub.slug})`);
    }
  }

  console.log('✓ All categories and subcategories synced successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
