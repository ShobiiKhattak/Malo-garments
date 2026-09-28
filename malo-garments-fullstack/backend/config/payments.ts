/*
 * Online payment rules — single source of truth on the server.
 * The storefront shows the same 3% but the server computes the real discount.
 */
export const ONLINE_METHODS = ['jazzcash', 'easypaisa', 'bank_transfer'] as const;
export const ALL_METHODS = ['cod', ...ONLINE_METHODS] as const;

/** Discount on the items subtotal when the customer pays online (3%). Change here to change the offer. */
export const ONLINE_DISCOUNT_PERCENT = 3;

export const isOnlineMethod = (m?: string | null): boolean => (ONLINE_METHODS as readonly string[]).includes(String(m || ''));

/** Unknown payment methods fall back to Cash on Delivery. */
export const normaliseMethod = (m?: unknown): string =>
  (ALL_METHODS as readonly string[]).includes(String(m)) ? String(m) : 'cod';

export const onlineDiscount = (subtotal: number): number => Math.round((subtotal * ONLINE_DISCOUNT_PERCENT) / 100);

/*
 * Transaction ID rules per method — keep in sync with malo-react/src/data/payments.ts (REF_RULES).
 * Only the SHAPE is checked here; the admin still confirms the money actually arrived.
 */
export const REF_RULES: Record<string, { pattern: RegExp; message: string }> = {
  jazzcash:      { pattern: /^[A-Za-z0-9]{24}$/,   message: 'NayaPay Transaction ID must be exactly 24 letters/numbers.' },
  easypaisa:     { pattern: /^\d{11}$/,            message: 'EasyPaisa Transaction ID must be exactly 11 digits.' },
  bank_transfer: { pattern: /^[A-Za-z0-9]{6,30}$/, message: 'Bank reference must be 6–30 letters/numbers.' },
};

/** Strips spaces so "1234 5678 901" and "12345678901" count as the same ID. */
export const cleanRef = (ref?: unknown): string => String(ref || '').replace(/\s+/g, '');

/** Returns an error message when the reference has the wrong shape for this method, otherwise null. */
export const refError = (method: string | null | undefined, ref: string): string | null => {
  const rule = REF_RULES[String(method || '')];
  if (!ref) return 'Please enter the transaction ID / reference from your payment receipt.';
  return rule && !rule.pattern.test(ref) ? rule.message : null;
};
