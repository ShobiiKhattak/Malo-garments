/*
 * ─────────────────────────────────────────────────────────────────────────
 *  ONLINE PAYMENT SETTINGS
 * ─────────────────────────────────────────────────────────────────────────
 *  • Yahan apne asli NayaPay / EasyPaisa / Bank account ki details likhein —
 *    customer ko payment page par yahi dikhengi.
 *  • ONLINE_DISCOUNT_PERCENT sirf dikhane ke liye hai; asli discount server
 *    (backend/config/payments.ts) nikalta hai. Dono jagah same number rakhein.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const ONLINE_DISCOUNT_PERCENT = 3
export const ONLINE_METHODS = ['jazzcash', 'easypaisa', 'bank_transfer'] as const
export type OnlineMethod = (typeof ONLINE_METHODS)[number]

export const isOnlineMethod = (m?: string | null): m is OnlineMethod => (ONLINE_METHODS as readonly string[]).includes(String(m))
export const onlineDiscount = (subtotal: number) => Math.round((subtotal * ONLINE_DISCOUNT_PERCENT) / 100)

export interface PayAccount { title: string; color: string; accountLabel: string; account: string; holder: string; bank?: string; steps: string[] }

export const PAY_ACCOUNTS: Record<OnlineMethod, PayAccount> = {
  // Key 'jazzcash' hi rehne dein (backend isi naam se pehchanta hai) — customer ko title 'NayaPay' dikhta hai.
  jazzcash: {
    title: 'NayaPay', color: '#d9214d', accountLabel: 'NayaPay number', account: '03322268785', holder: 'Shahab Ali Shahid',
    steps: ['Open your NayaPay app → Send Money', 'Enter the number below and the exact amount', 'Copy the Transaction ID from the receipt'],
  },
  easypaisa: {
    title: 'EasyPaisa', color: '#1f9d55', accountLabel: 'EasyPaisa number', account: '03105522581', holder: 'Shahab Ali Shahid',
    steps: ['Open your EasyPaisa app → Send Money', 'Enter the number below and the exact amount', 'Copy the Transaction ID from the receipt'],
  },
  bank_transfer: {
    title: 'Bank Transfer', color: '#1d4e89', accountLabel: 'IBAN / Account number', account: 'PK00 MEZN 0000 0000 0000 0000', holder: 'Shahab Ali Shahid', bank: 'Shahab Ali Shahid',
    steps: ['Open your banking app → Transfer / Raast', 'Enter the account below and the exact amount', 'Copy the Transaction / Reference number from the receipt'],
  },
}

/*
 * TRANSACTION ID RULES — customer galat ya adhoori ID submit nahi kar sakta.
 *  • Asli receipt dekh kar length confirm kar lein; backend/config/payments.ts mein bhi same rakhein.
 *  • Yeh sirf shakal check karta hai — paisa aaya ya nahi, woh admin app mein dekh kar confirm karta hai.
 */
export const REF_RULES: Record<OnlineMethod, { pattern: RegExp; message: string; example: string; numeric?: boolean; maxLength: number }> = {
  // 'jazzcash' = NayaPay. Yeh naam na badlein, warna NayaPay ka payment page crash hoga.
  jazzcash:      { pattern: /^[A-Za-z0-9]{24}$/,   message: 'NayaPay Transaction ID must be exactly 24 letters/numbers.', example: '24 characters', maxLength: 24 },
  easypaisa:     { pattern: /^\d{11}$/,            message: 'EasyPaisa Transaction ID must be exactly 11 digits.', example: '11 digits', numeric: true, maxLength: 11 },
  bank_transfer: { pattern: /^[A-Za-z0-9]{6,30}$/, message: 'Bank reference must be 6–30 letters/numbers.', example: '6–30 characters', maxLength: 30 },
}

export const cleanRef = (ref: string) => ref.replace(/\s+/g, '')
export const refError = (method: OnlineMethod, ref: string): string | null =>
  !ref ? 'Please enter the transaction ID from your receipt.' : REF_RULES[method].pattern.test(ref) ? null : REF_RULES[method].message
