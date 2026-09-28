/*
 * Design Studio pricing — single source of truth.
 * The storefront fetches this table (GET /api/design/pricing) to show the live price,
 * and POST /api/orders uses the same table to charge, so both always agree.
 *
 * price = base + pattern + every style option + size + colour
 * Edit the numbers below to change what customers pay for customisations.
 */
export type DesignType = 'dress' | 'bra' | 'underwear' | 'nighty';

export interface DesignPricing {
  base: number;
  patterns: Record<string, number>;
  styles: Record<string, Record<string, number>>; // group key -> option -> extra
  sizes: Record<string, number>;
  colors: Record<string, number>;                 // colours not listed cost 0 extra
}

const PREMIUM_COLORS = { Burgundy: 100, Emerald: 100 };

export const DESIGN_PRICING: Record<DesignType, DesignPricing> = {
  dress: {
    base: 4500,
    patterns: { Solid: 0, Stripes: 150, 'Polka Dot': 200, Floral: 250, Lace: 500 },
    styles: {
      neckline: { Round: 0, 'V-Neck': 100, 'Off-Shoulder': 250, Halter: 300 },
      length: { Mini: 0, Midi: 300, Maxi: 600 },
      sleeve: { Sleeveless: 0, 'Short Sleeve': 150, 'Long Sleeve': 400 },
    },
    sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 150, XXL: 300 },
    colors: PREMIUM_COLORS,
  },
  bra: {
    base: 1600,
    patterns: { Solid: 0, 'Polka Dot': 150, Floral: 200, Lace: 350 },
    styles: { style: { 'T-Shirt Bra': 0, Sports: 100, Wireless: 150, 'Push-Up': 200 } },
    sizes: { '32B': 0, '34B': 0, '34C': 0, '36B': 0, '36C': 50, '38B': 50, '38C': 100 },
    colors: PREMIUM_COLORS,
  },
  underwear: {
    base: 900,
    patterns: { Solid: 0, 'Polka Dot': 100, Lace: 250 },
    styles: { style: { Bikini: 0, Hipster: 0, Thong: 50, Boyshort: 100 } },
    sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 100 },
    colors: PREMIUM_COLORS,
  },
  nighty: {
    base: 3200,
    patterns: { Solid: 0, Floral: 200, Lace: 450, 'Satin Sheen': 500 },
    styles: {
      length: { Short: 0, 'Knee-Length': 300, Long: 600 },
      sleeve: { Sleeveless: 0, 'Spaghetti Strap': 0, 'Short Sleeve': 150 },
    },
    sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 150 },
    colors: PREMIUM_COLORS,
  },
};

export interface DesignCustomization {
  color?: string;
  pattern?: string;
  styles?: Record<string, string>;
  size?: string;
}

/** Returns the price of one piece, or 0 when the design type is unknown. Unknown options add nothing. */
export function priceDesign(type: string, c: DesignCustomization = {}): number {
  const t = DESIGN_PRICING[type as DesignType];
  if (!t) return 0;
  let price = t.base;
  if (c.pattern) price += t.patterns[c.pattern] ?? 0;
  for (const [group, option] of Object.entries(c.styles ?? {})) price += t.styles[group]?.[option] ?? 0;
  if (c.size) price += t.sizes[c.size] ?? 0;
  if (c.color) price += t.colors[c.color] ?? 0;
  return price;
}
