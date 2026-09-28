/*
 * ══════════════════════════════════════════════════════════════
 * Malo Garments — Seed Data
 * Products, categories, subcategories & admin credentials.
 * Used by seed.ts to populate the database.
 * ══════════════════════════════════════════════════════════════
 */
import type { SeedData } from '../types';

export const MALO_SEED: SeedData = {

  /* ─── Admin Credentials ─── */
  admin: {
    username: 'admin',
    password: 'admin123',
    name: 'Malo Admin'
  },

  /* ─── Categories ─── */
  categories: [
    {
      id: 'cat-1',
      name: 'Ladies Garments',
      slug: 'ladies-garments',
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1000&fit=crop&q=80',
      subcategories: [
        { id: 'sub-1-1', name: 'Dresses', slug: 'dresses' },
        { id: 'sub-1-2', name: 'Kurtis', slug: 'kurtis' },
        { id: 'sub-1-3', name: 'Tops', slug: 'tops' },
        { id: 'sub-1-4', name: 'Shirts', slug: 'shirts' },
        { id: 'sub-1-5', name: 'Blouses', slug: 'blouses' },
        { id: 'sub-1-6', name: 'Suits', slug: 'suits' },
        { id: 'sub-1-7', name: 'Skirts', slug: 'skirts' },
        { id: 'sub-1-8', name: 'Jeans', slug: 'jeans' },
        { id: 'sub-1-9', name: 'Trousers', slug: 'trousers' },
        { id: 'sub-1-10', name: 'Leggings', slug: 'leggings' },
        { id: 'sub-1-11', name: 'Shorts', slug: 'shorts' }
      ]
    },
    {
      id: 'cat-2',
      name: 'Undergarments',
      slug: 'undergarments',
      image: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=800&h=1000&fit=crop&q=80',
      subcategories: [
        { id: 'sub-2-1', name: "Women's Underwear", slug: 'womens-underwear' },
        { id: 'sub-2-2', name: 'Panties', slug: 'panties' },
        { id: 'sub-2-3', name: 'Camisoles', slug: 'camisoles' },
        { id: 'sub-2-4', name: 'Slips', slug: 'slips' }
      ]
    },
    {
      id: 'cat-3',
      name: 'Bras',
      slug: 'bras',
      image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&h=1000&fit=crop&q=80',
      subcategories: [
        { id: 'sub-3-1', name: 'T-Shirt Bras', slug: 't-shirt-bras' },
        { id: 'sub-3-2', name: 'Push-Up Bras', slug: 'push-up-bras' },
        { id: 'sub-3-3', name: 'Padded Bras', slug: 'padded-bras' },
        { id: 'sub-3-4', name: 'Non-Padded Bras', slug: 'non-padded-bras' },
        { id: 'sub-3-5', name: 'Sports Bras', slug: 'sports-bras' },
        { id: 'sub-3-6', name: 'Wireless Bras', slug: 'wireless-bras' },
        { id: 'sub-3-7', name: 'Bralettes', slug: 'bralettes' },
        { id: 'sub-3-8', name: 'Nursing Bras', slug: 'nursing-bras' }
      ]
    },
    {
      id: 'cat-4',
      name: 'Nightwear',
      slug: 'nightwear',
      image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&h=1000&fit=crop&q=80',
      subcategories: [
        { id: 'sub-4-1', name: 'Nighties', slug: 'nighties' },
        { id: 'sub-4-2', name: 'Night Dresses', slug: 'night-dresses' },
        { id: 'sub-4-3', name: 'Night Suits', slug: 'night-suits' },
        { id: 'sub-4-4', name: 'Pajama Sets', slug: 'pajama-sets' },
        { id: 'sub-4-5', name: 'Night Shorts', slug: 'night-shorts' },
        { id: 'sub-4-6', name: 'Robes', slug: 'robes' }
      ]
    },
    {
      id: 'cat-5',
      name: 'Lingerie',
      slug: 'lingerie',
      image: 'https://images.unsplash.com/photo-1617331140180-e8262094733a?w=800&h=1000&fit=crop&q=80',
      subcategories: [
        { id: 'sub-5-1', name: 'Lingerie Sets', slug: 'lingerie-sets' },
        { id: 'sub-5-2', name: 'Lace Sets', slug: 'lace-sets' },
        { id: 'sub-5-3', name: 'Satin Sets', slug: 'satin-sets' },
        { id: 'sub-5-4', name: 'Bodysuits', slug: 'bodysuits' },
        { id: 'sub-5-5', name: 'Bridal Lingerie', slug: 'bridal-lingerie' }
      ]
    },
    {
      id: 'cat-6',
      name: 'Activewear',
      slug: 'activewear',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=1000&fit=crop&q=80',
      subcategories: [
        { id: 'sub-6-1', name: 'Sports Bras', slug: 'sports-bras-active' },
        { id: 'sub-6-2', name: 'Sports T-Shirts', slug: 'sports-t-shirts' },
        { id: 'sub-6-3', name: 'Sports Leggings', slug: 'sports-leggings' },
        { id: 'sub-6-4', name: 'Sports Shorts', slug: 'sports-shorts' },
        { id: 'sub-6-5', name: 'Workout Sets', slug: 'workout-sets' }
      ]
    },
    {
      id: 'cat-7',
      name: 'Shapewear',
      slug: 'shapewear',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1000&fit=crop&q=80',
      subcategories: [
        { id: 'sub-7-1', name: 'Shapewear', slug: 'shapewear-basics' },
        { id: 'sub-7-2', name: 'Waist Cinchers', slug: 'waist-cinchers' },
        { id: 'sub-7-3', name: 'Shapewear Bodysuits', slug: 'shapewear-bodysuits' }
      ]
    },
    {
      id: 'cat-8',
      name: 'Traditional Wear',
      slug: 'traditional-wear',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1000&fit=crop&q=80',
      subcategories: [
        { id: 'sub-8-1', name: 'Abayas', slug: 'abayas' },
        { id: 'sub-8-2', name: 'Hijabs', slug: 'hijabs' },
        { id: 'sub-8-3', name: 'Dupattas', slug: 'dupattas' },
        { id: 'sub-8-4', name: 'Shalwar Suits', slug: 'shalwar-suits' },
        { id: 'sub-8-5', name: '2-Piece Suits', slug: '2-piece-suits' },
        { id: 'sub-8-6', name: '3-Piece Suits', slug: '3-piece-suits' }
      ]
    },
    {
      id: 'cat-9',
      name: 'Outerwear',
      slug: 'outerwear',
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&h=1000&fit=crop&q=80',
      subcategories: [
        { id: 'sub-9-1', name: 'Jackets', slug: 'jackets' },
        { id: 'sub-9-2', name: 'Blazers', slug: 'blazers' },
        { id: 'sub-9-3', name: 'Cardigans', slug: 'cardigans' },
        { id: 'sub-9-4', name: 'Shrugs', slug: 'shrugs' },
        { id: 'sub-9-5', name: 'Sweaters', slug: 'sweaters' },
        { id: 'sub-9-6', name: 'Coats', slug: 'coats' }
      ]
    }
  ],

  /* ─── Products (24 items) ─── */
  products: [
    // ──── Ladies Garments — Dresses ────
    {
      id: 'prod-001',
      name: 'Floral Maxi Dress',
      price: 4500,
      original_price: 6000,
      category_id: 'cat-1',
      subcategory_id: 'sub-1-1',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Blush Pink', hex: '#F2B5B5' },
        { name: 'Sky Blue', hex: '#87CEEB' }
      ],
      stock: 25,
      images: [
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop'
      ],
      description: 'A beautiful floral maxi dress crafted from premium lightweight chiffon. Perfect for summer outings and evening gatherings. Features a flattering A-line silhouette with adjustable waist tie.',
      rating: 4.5,
      reviews: 32,
      date_added: '2026-08-15',
      featured: true,
      on_sale: true
    },
    {
      id: 'prod-002',
      name: 'Elegant A-Line Midi Dress',
      price: 5200,
      original_price: 5200,
      category_id: 'cat-1',
      subcategory_id: 'sub-1-1',
      sizes: ['S', 'M', 'L'],
      colors: [
        { name: 'Black', hex: '#111111' },
        { name: 'Burgundy', hex: '#800020' }
      ],
      stock: 18,
      images: [
        'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&h=800&fit=crop'
      ],
      description: 'A timeless midi dress with an elegant A-line cut. Made from soft crepe fabric that drapes beautifully. Ideal for both office wear and dinner dates.',
      rating: 4.8,
      reviews: 45,
      date_added: '2026-09-01',
      featured: true,
      on_sale: false
    },
    {
      id: 'prod-003',
      name: 'Casual Wrap Dress',
      price: 3800,
      original_price: 4500,
      category_id: 'cat-1',
      subcategory_id: 'sub-1-1',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Olive Green', hex: '#556B2F' },
        { name: 'Dusty Rose', hex: '#DCAE96' }
      ],
      stock: 30,
      images: [
        'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=800&fit=crop'
      ],
      description: 'A versatile wrap dress that flatters every body type. Made from breathable cotton blend fabric with a beautiful print. Perfect for casual outings.',
      rating: 4.2,
      reviews: 21,
      date_added: '2026-08-20',
      featured: false,
      on_sale: true
    },
    {
      id: 'prod-004',
      name: 'Embroidered Evening Gown',
      price: 8500,
      original_price: 10000,
      category_id: 'cat-1',
      subcategory_id: 'sub-1-1',
      sizes: ['S', 'M', 'L'],
      colors: [
        { name: 'Navy Blue', hex: '#000080' },
        { name: 'Champagne', hex: '#F7E7CE' }
      ],
      stock: 8,
      images: [
        'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=600&h=800&fit=crop'
      ],
      description: 'A stunning evening gown featuring intricate hand embroidery. Made from luxurious silk blend fabric. Perfect for formal events and celebrations.',
      rating: 4.9,
      reviews: 15,
      date_added: '2026-09-05',
      featured: true,
      on_sale: true
    },

    // ──── Ladies Garments — Tops & Blouses ────
    {
      id: 'prod-005',
      name: 'Silk Button-Down Blouse',
      price: 3200,
      original_price: 3200,
      category_id: 'cat-1',
      subcategory_id: 'sub-1-2',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Cream', hex: '#FFF8DC' },
        { name: 'Soft Pink', hex: '#FFB6C1' }
      ],
      stock: 40,
      images: [
        'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1604695573706-53170668f6a6?w=600&h=800&fit=crop'
      ],
      description: 'A classic silk button-down blouse that\'s a wardrobe essential. Smooth, breathable fabric with a tailored fit. Pairs perfectly with trousers or skirts.',
      rating: 4.6,
      reviews: 52,
      date_added: '2026-08-10',
      featured: false,
      on_sale: false
    },
    {
      id: 'prod-006',
      name: 'Ruffle Sleeve Peplum Top',
      price: 2800,
      original_price: 3500,
      category_id: 'cat-1',
      subcategory_id: 'sub-1-2',
      sizes: ['S', 'M', 'L'],
      colors: [
        { name: 'Coral', hex: '#FF7F50' },
        { name: 'Lavender', hex: '#E6E6FA' }
      ],
      stock: 22,
      images: [
        'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1551489186-cf8726f514f8?w=600&h=800&fit=crop'
      ],
      description: 'A feminine peplum top with stunning ruffle sleeves. Made from lightweight polyester blend. Perfect for brunch or a day out with friends.',
      rating: 4.3,
      reviews: 28,
      date_added: '2026-08-25',
      featured: true,
      on_sale: true
    },
    {
      id: 'prod-007',
      name: 'Lace Trim Camisole',
      price: 1800,
      original_price: 1800,
      category_id: 'cat-1',
      subcategory_id: 'sub-1-2',
      sizes: ['XS', 'S', 'M', 'L'],
      colors: [
        { name: 'Black', hex: '#111111' },
        { name: 'Nude', hex: '#E3BC9A' },
        { name: 'White', hex: '#FFFFFF' }
      ],
      stock: 50,
      images: [
        'https://images.unsplash.com/photo-1583846783214-2c0a8e001b32?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=800&fit=crop'
      ],
      description: 'A delicate camisole with beautiful lace trim detailing. Made from soft satin fabric that feels luxurious against the skin. Layer it under blazers or wear solo.',
      rating: 4.4,
      reviews: 38,
      date_added: '2026-07-20',
      featured: false,
      on_sale: false
    },
    {
      id: 'prod-008',
      name: 'Off-Shoulder Crop Top',
      price: 2200,
      original_price: 2800,
      category_id: 'cat-1',
      subcategory_id: 'sub-1-2',
      sizes: ['S', 'M', 'L'],
      colors: [
        { name: 'Red', hex: '#DC143C' },
        { name: 'Mustard', hex: '#FFDB58' }
      ],
      stock: 15,
      images: [
        'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec515c7?w=600&h=800&fit=crop'
      ],
      description: 'A trendy off-shoulder crop top with a flattering fit. Made from stretchy cotton blend for maximum comfort. Perfect for parties and casual outings.',
      rating: 4.1,
      reviews: 19,
      date_added: '2026-08-30',
      featured: false,
      on_sale: true
    },

    // ──── Ladies Garments — Skirts ────
    {
      id: 'prod-009',
      name: 'Pleated Midi Skirt',
      price: 3500,
      original_price: 3500,
      category_id: 'cat-1',
      subcategory_id: 'sub-1-3',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Emerald', hex: '#50C878' },
        { name: 'Beige', hex: '#F5F5DC' }
      ],
      stock: 20,
      images: [
        'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1577900232427-18219b9166a0?w=600&h=800&fit=crop'
      ],
      description: 'An elegant pleated midi skirt that moves beautifully as you walk. Made from flowy polyester fabric with a comfortable elastic waistband.',
      rating: 4.7,
      reviews: 34,
      date_added: '2026-08-12',
      featured: true,
      on_sale: false
    },
    {
      id: 'prod-010',
      name: 'Denim Mini Skirt',
      price: 2500,
      original_price: 3000,
      category_id: 'cat-1',
      subcategory_id: 'sub-1-3',
      sizes: ['XS', 'S', 'M', 'L'],
      colors: [
        { name: 'Light Blue', hex: '#ADD8E6' },
        { name: 'Dark Wash', hex: '#1C3144' }
      ],
      stock: 35,
      images: [
        'https://images.unsplash.com/photo-1592301933927-35b597393c0a?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=800&fit=crop'
      ],
      description: 'A classic denim mini skirt with a modern twist. Features a button-front design and raw hem. Perfect for casual and semi-casual looks.',
      rating: 4.0,
      reviews: 22,
      date_added: '2026-07-28',
      featured: false,
      on_sale: true
    },

    // ──── Ladies Garments — Trousers ────
    {
      id: 'prod-011',
      name: 'Wide-Leg Palazzo Pants',
      price: 3800,
      original_price: 3800,
      category_id: 'cat-1',
      subcategory_id: 'sub-1-4',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Black', hex: '#111111' },
        { name: 'Ivory', hex: '#FFFFF0' }
      ],
      stock: 28,
      images: [
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop'
      ],
      description: 'Elegant wide-leg palazzo pants that combine comfort with style. Made from flowing crepe fabric with a high-rise waist. Perfect for office or formal settings.',
      rating: 4.6,
      reviews: 41,
      date_added: '2026-08-18',
      featured: false,
      on_sale: false
    },
    {
      id: 'prod-012',
      name: 'Slim Fit Cigarette Trousers',
      price: 3200,
      original_price: 4000,
      category_id: 'cat-1',
      subcategory_id: 'sub-1-4',
      sizes: ['S', 'M', 'L'],
      colors: [
        { name: 'Charcoal', hex: '#36454F' },
        { name: 'Camel', hex: '#C19A6B' }
      ],
      stock: 32,
      images: [
        'https://images.unsplash.com/photo-1551854838-212c50b4c184?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&h=800&fit=crop'
      ],
      description: 'Sleek slim-fit cigarette trousers for a polished look. Made from premium stretch fabric for all-day comfort. A wardrobe staple for every woman.',
      rating: 4.5,
      reviews: 37,
      date_added: '2026-08-22',
      featured: false,
      on_sale: true
    },

    // ──── Undergarments — Bras ────
    {
      id: 'prod-013',
      name: 'T-Shirt Bra — Seamless',
      price: 1500,
      original_price: 1500,
      category_id: 'cat-2',
      subcategory_id: 'sub-2-1',
      sizes: ['32B', '34B', '34C', '36B', '36C', '38B'],
      colors: [
        { name: 'Nude', hex: '#E3BC9A' },
        { name: 'Black', hex: '#111111' },
        { name: 'White', hex: '#FFFFFF' }
      ],
      stock: 60,
      images: [
        'https://images.unsplash.com/photo-1617331140180-e8262094733a?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=600&h=800&fit=crop'
      ],
      description: 'An everyday essential seamless T-shirt bra with molded cups for a smooth silhouette. Features adjustable straps and a comfortable under-band.',
      rating: 4.7,
      reviews: 68,
      date_added: '2026-07-15',
      featured: false,
      on_sale: false
    },
    {
      id: 'prod-014',
      name: 'Lace Push-Up Bra',
      price: 2200,
      original_price: 2800,
      category_id: 'cat-2',
      subcategory_id: 'sub-2-1',
      sizes: ['32B', '34B', '34C', '36B', '36C'],
      colors: [
        { name: 'Blush', hex: '#F2B5B5' },
        { name: 'Black', hex: '#111111' },
        { name: 'Burgundy', hex: '#800020' }
      ],
      stock: 45,
      images: [
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=800&fit=crop'
      ],
      description: 'A gorgeous lace push-up bra with delicate detailing. Provides lift and support while maintaining a natural shape. Perfect for special occasions.',
      rating: 4.4,
      reviews: 55,
      date_added: '2026-08-05',
      featured: true,
      on_sale: true
    },

    // ──── Undergarments — Panties ────
    {
      id: 'prod-015',
      name: 'Cotton Bikini 5-Pack',
      price: 1800,
      original_price: 2500,
      category_id: 'cat-2',
      subcategory_id: 'sub-2-2',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Assorted Pastels', hex: '#FFB6C1' }
      ],
      stock: 55,
      images: [
        'https://images.unsplash.com/photo-1608234808654-2a8875faa7fd?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=800&fit=crop'
      ],
      description: 'A 5-pack of soft cotton bikini panties in assorted pastel colors. Breathable, comfortable, and perfect for everyday wear. Elastic waistband for a secure fit.',
      rating: 4.3,
      reviews: 72,
      date_added: '2026-07-25',
      featured: false,
      on_sale: true
    },
    {
      id: 'prod-016',
      name: 'Seamless Thong 3-Pack',
      price: 1200,
      original_price: 1200,
      category_id: 'cat-2',
      subcategory_id: 'sub-2-2',
      sizes: ['S', 'M', 'L'],
      colors: [
        { name: 'Nude/Black/White', hex: '#E3BC9A' }
      ],
      stock: 40,
      images: [
        'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=800&fit=crop'
      ],
      description: 'A 3-pack of seamless thong underwear. No visible panty lines guaranteed. Made from ultra-soft microfiber for all-day comfort.',
      rating: 4.1,
      reviews: 44,
      date_added: '2026-08-02',
      featured: false,
      on_sale: false
    },

    // ──── Undergarments — Lingerie Sets ────
    {
      id: 'prod-017',
      name: 'Lace Bralette & Panty Set',
      price: 3500,
      original_price: 4200,
      category_id: 'cat-2',
      subcategory_id: 'sub-2-3',
      sizes: ['S', 'M', 'L'],
      colors: [
        { name: 'Wine Red', hex: '#722F37' },
        { name: 'Midnight Blue', hex: '#191970' }
      ],
      stock: 15,
      images: [
        'https://images.unsplash.com/photo-1617331140180-e8262094733a?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=600&h=800&fit=crop'
      ],
      description: 'A luxurious matching lace bralette and panty set. Delicate floral lace with a comfortable wireless design. Makes a perfect gift or self-treat.',
      rating: 4.8,
      reviews: 29,
      date_added: '2026-09-02',
      featured: true,
      on_sale: true
    },
    {
      id: 'prod-018',
      name: 'Satin Cami & Shorts Set',
      price: 2800,
      original_price: 2800,
      category_id: 'cat-2',
      subcategory_id: 'sub-2-3',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Rose Gold', hex: '#B76E79' },
        { name: 'Champagne', hex: '#F7E7CE' }
      ],
      stock: 20,
      images: [
        'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=800&fit=crop'
      ],
      description: 'A beautiful satin camisole and shorts set with lace trim. Silky smooth fabric for a luxurious feel. Perfect for lounging or sleeping in style.',
      rating: 4.5,
      reviews: 33,
      date_added: '2026-08-08',
      featured: false,
      on_sale: false
    },

    // ──── Undergarments — Sleepwear ────
    {
      id: 'prod-019',
      name: 'Silk Nightgown — Long',
      price: 4000,
      original_price: 5000,
      category_id: 'cat-2',
      subcategory_id: 'sub-2-4',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Dusty Pink', hex: '#D4A0A0' },
        { name: 'Pearl White', hex: '#F0EAD6' }
      ],
      stock: 12,
      images: [
        'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=800&fit=crop'
      ],
      description: 'A luxurious long silk nightgown with delicate lace detailing at the neckline. Feels incredibly soft against the skin. Perfect for a restful night.',
      rating: 4.6,
      reviews: 26,
      date_added: '2026-08-28',
      featured: true,
      on_sale: true
    },
    {
      id: 'prod-020',
      name: 'Cotton Pyjama Set — Floral',
      price: 2500,
      original_price: 2500,
      category_id: 'cat-2',
      subcategory_id: 'sub-2-4',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Floral Blue', hex: '#6495ED' },
        { name: 'Floral Pink', hex: '#FFB6C1' }
      ],
      stock: 30,
      images: [
        'https://images.unsplash.com/photo-1617331140180-e8262094733a?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=600&h=800&fit=crop'
      ],
      description: 'A cozy cotton pyjama set with a charming floral print. Features a button-front top and elasticated drawstring pants. Perfect for lounging at home.',
      rating: 4.4,
      reviews: 48,
      date_added: '2026-07-30',
      featured: false,
      on_sale: false
    },

    // ──── Accessories — Scarves & Dupattas ────
    {
      id: 'prod-021',
      name: 'Silk Blend Printed Scarf',
      price: 1500,
      original_price: 2000,
      category_id: 'cat-3',
      subcategory_id: 'sub-3-1',
      sizes: ['One Size'],
      colors: [
        { name: 'Multi Floral', hex: '#DA70D6' },
        { name: 'Geometric Blue', hex: '#4682B4' }
      ],
      stock: 45,
      images: [
        'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=600&h=800&fit=crop'
      ],
      description: 'A versatile silk blend scarf with a vibrant print. Can be worn as a neck scarf, headband, or bag accessory. Lightweight and perfect for all seasons.',
      rating: 4.2,
      reviews: 18,
      date_added: '2026-08-14',
      featured: false,
      on_sale: true
    },
    {
      id: 'prod-022',
      name: 'Embroidered Chiffon Dupatta',
      price: 2200,
      original_price: 2200,
      category_id: 'cat-3',
      subcategory_id: 'sub-3-1',
      sizes: ['One Size'],
      colors: [
        { name: 'Peach', hex: '#FFDAB9' },
        { name: 'Mint Green', hex: '#98FF98' }
      ],
      stock: 25,
      images: [
        'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=600&h=800&fit=crop'
      ],
      description: 'A beautiful chiffon dupatta with intricate embroidery along the borders. Adds an elegant finishing touch to any outfit. Lightweight and easy to drape.',
      rating: 4.5,
      reviews: 23,
      date_added: '2026-09-03',
      featured: false,
      on_sale: false
    },

    // ──── Accessories — Belts ────
    {
      id: 'prod-023',
      name: 'Leather Waist Belt — Gold Buckle',
      price: 1800,
      original_price: 1800,
      category_id: 'cat-3',
      subcategory_id: 'sub-3-2',
      sizes: ['S', 'M', 'L'],
      colors: [
        { name: 'Black', hex: '#111111' },
        { name: 'Tan', hex: '#D2B48C' }
      ],
      stock: 38,
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1585856331925-93a31a7e3a7f?w=600&h=800&fit=crop'
      ],
      description: 'A premium leather waist belt with a sleek gold-tone buckle. Elevates any outfit from dresses to trousers. Made from genuine leather.',
      rating: 4.3,
      reviews: 31,
      date_added: '2026-08-06',
      featured: false,
      on_sale: false
    },

    // ──── Accessories — Bags ────
    {
      id: 'prod-024',
      name: 'Quilted Crossbody Bag',
      price: 3500,
      original_price: 4500,
      category_id: 'cat-3',
      subcategory_id: 'sub-3-3',
      sizes: ['One Size'],
      colors: [
        { name: 'Blush Pink', hex: '#F2B5B5' },
        { name: 'Black', hex: '#111111' },
        { name: 'Cream', hex: '#FFF8DC' }
      ],
      stock: 18,
      images: [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=800&fit=crop'
      ],
      description: 'A chic quilted crossbody bag with a chain strap. Features multiple compartments for organized storage. Perfect for day-to-night transitions.',
      rating: 4.7,
      reviews: 42,
      date_added: '2026-09-04',
      featured: true,
      on_sale: true
    }
  ]
};
