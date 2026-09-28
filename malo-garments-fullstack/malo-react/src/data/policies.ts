/*
 * ─────────────────────────────────────────────────────────────────────────
 *  STORE POLICIES & FAQ — the text of /returns, /shipping, /privacy, /terms, /faq
 * ─────────────────────────────────────────────────────────────────────────
 *  • Yeh ek achi shuruaat (template) hai — live karne se pehle apni asal policy ke
 *    mutabiq parh kar badal lein. Yeh qanooni mashwara (legal advice) nahi hai.
 *  • Numbers (7 din, Rs. 250, Rs. 5,000, 3–5 din, 3%) website ke baqi hisson se
 *    milte hain — agar yahan badlein to checkout / emails mein bhi badlein.
 *  • Paragraph = string · Bullet list = { list: [...] } · Highlight box = { note: '...' }
 * ─────────────────────────────────────────────────────────────────────────
 */
import { STORE } from './homeContent'

export type Block = string | { list: string[] } | { note: string }
export interface PolicySection { id: string; icon: string; title: string; body: Block[] }
export interface Policy {
  slug: string
  title: string
  kicker: string
  intro: string
  updated: string
  highlights: { icon: string; label: string; sub: string }[]
  sections: PolicySection[]
  /** FAQ-style page: each section's body is shown as question/answer accordions */
  faq?: { q: string; a: string }[]
}

const UPDATED = '27 September 2026'
const EMAIL = STORE.email
const WA = STORE.phone

export const POLICIES: Record<string, Policy> = {
  returns: {
    slug: 'returns',
    title: 'Returns & Exchanges',
    kicker: 'Shop with confidence',
    intro: 'Not the right fit? We make exchanges simple. Here is everything you need to know about returning or exchanging your order.',
    updated: UPDATED,
    highlights: [
      { icon: '🔁', label: '7-day exchange', sub: 'from the day it arrives' },
      { icon: '🎁', label: 'Our mistake, our cost', sub: 'wrong or faulty items replaced free' },
      { icon: '💸', label: 'Refunds in 5–7 days', sub: 'when an exchange is not possible' },
    ],
    sections: [
      {
        id: 'promise', icon: '💗', title: 'Our promise',
        body: [
          'You can exchange any eligible item for a different size or colour within 7 days of delivery.',
          { note: 'Received a wrong, damaged or faulty item? Tell us within 48 hours of delivery and we will replace it free of charge — including shipping.' },
        ],
      },
      {
        id: 'eligible', icon: '✅', title: 'What can be exchanged',
        body: [
          'To keep every piece fresh for the next customer, items must be:',
          { list: ['Unworn, unwashed and unaltered', 'With all original tags attached', 'In the original packaging', 'Returned with the order ID'] },
        ],
      },
      {
        id: 'hygiene', icon: '🧼', title: 'Intimate wear & hygiene',
        body: [
          'For hygiene reasons, bras, panties, lingerie, shapewear and swimwear can only be exchanged if they are unopened and still in their sealed original packaging.',
          'This does not apply to faulty or wrong items — those are always replaced.',
        ],
      },
      {
        id: 'not-eligible', icon: '🚫', title: 'Not eligible',
        body: [{ list: [
          'Items returned after 7 days of delivery',
          'Worn, washed, damaged or perfumed items',
          'Custom pieces made in the Design Studio (made to order), unless faulty',
          'Free gifts and gift packaging',
        ] }],
      },
      {
        id: 'how', icon: '📦', title: 'How to request an exchange',
        body: [{ list: [
          `Message us on WhatsApp (${WA}) or email ${EMAIL} with your order ID and a photo of the item.`,
          'We confirm your exchange and share the return address.',
          'Pack the item securely and send it back.',
          'Once we receive and check it, your new item is dispatched within 3 working days.',
        ] }],
      },
      {
        id: 'refunds', icon: '💳', title: 'Refunds',
        body: [
          'If the size or colour you want is out of stock, we offer a refund instead.',
          { list: [
            'Online payments (NayaPay, EasyPaisa, bank transfer) are refunded to the same account.',
            'Cash on Delivery orders are refunded by bank or wallet transfer — we will ask for your details.',
            'Refunds are sent within 5–7 working days after we approve them.',
          ] },
        ],
      },
      {
        id: 'shipping-cost', icon: '🚚', title: 'Return shipping',
        body: ['For a change of mind or size, the customer pays the return shipping. If the mistake is ours, we cover all shipping costs.'],
      },
    ],
  },

  shipping: {
    slug: 'shipping',
    title: 'Shipping & Delivery',
    kicker: 'From our studio to your door',
    intro: 'We deliver across Pakistan in plain, discreet packaging. Here is how shipping works.',
    updated: UPDATED,
    highlights: [
      { icon: '🚚', label: '3–5 working days', sub: 'delivery across Pakistan' },
      { icon: '🎀', label: 'Free over Rs. 5,000', sub: 'Rs. 250 below that' },
      { icon: '🤫', label: 'Discreet packaging', sub: 'no product details outside' },
    ],
    sections: [
      {
        id: 'areas', icon: '🗺️', title: 'Where we deliver',
        body: ['We deliver to all cities and towns across Pakistan through trusted courier partners.'],
      },
      {
        id: 'times', icon: '⏱️', title: 'Delivery times',
        body: [{ list: [
          'Orders are packed and dispatched within 1–2 working days.',
          'Delivery takes 3–5 working days after dispatch (Sundays and public holidays excluded).',
          'Remote areas can take a little longer.',
          'Online-payment orders are dispatched once your payment is confirmed.',
        ] }],
      },
      {
        id: 'charges', icon: '💰', title: 'Delivery charges',
        body: [
          { list: ['Orders of Rs. 5,000 and above: free delivery', 'Orders below Rs. 5,000: Rs. 250'] },
          { note: 'Pay online with NayaPay, EasyPaisa or bank transfer and get 3% off your items.' },
        ],
      },
      {
        id: 'tracking', icon: '📍', title: 'Tracking your order',
        body: ['We email you when your order is confirmed and again when it ships, with the expected delivery dates. You can also see your order status any time under My Account.'],
      },
      {
        id: 'packaging', icon: '🎁', title: 'Discreet packaging',
        body: ['Every order is sent in plain packaging with no product description on the outside — only your name and address.'],
      },
      {
        id: 'failed', icon: '📞', title: 'If we cannot reach you',
        body: ['The courier will call before delivering. If delivery fails twice, or a Cash on Delivery parcel is refused, the order returns to us and is cancelled. Please keep your phone reachable.'],
      },
    ],
  },

  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    kicker: 'Your privacy matters',
    intro: 'We only collect what we need to deliver your order and look after you — and we never sell your data.',
    updated: UPDATED,
    highlights: [
      { icon: '🔒', label: 'Never sold', sub: 'your data is not for sale' },
      { icon: '💳', label: 'No card details', sub: 'we never see or store them' },
      { icon: '🚫', label: 'No ad trackers', sub: 'no third-party tracking' },
    ],
    sections: [
      {
        id: 'collect', icon: '📝', title: 'What we collect',
        body: [{ list: [
          'Your name, email, phone number and delivery address when you order or create an account.',
          'Your order history and saved addresses.',
          'If you sign in with Google: your name and email from Google.',
          'For online payments: only the transaction ID you enter — never card or wallet passwords.',
          'Measurements and preferences you enter in the Size Assistant or Design Studio.',
          'Messages you send us.',
        ] }],
      },
      {
        id: 'use', icon: '🎯', title: 'How we use it',
        body: [{ list: [
          'To process, deliver and support your orders.',
          'To send order, payment and shipping updates by email, and login codes by SMS.',
          'To reply to your questions.',
          'To send offers — only if you subscribe to our newsletter. You can unsubscribe any time.',
        ] }],
      },
      {
        id: 'share', icon: '🤝', title: 'Who we share it with',
        body: [
          'Only with services that help us run the store, and only what they need:',
          { list: [
            'Courier companies — your name, phone and address to deliver your parcel.',
            'Email and SMS providers — to send you order updates and login codes.',
            'Google — for Google sign-in, and to power our AI Size Assistant and Design Studio previews (the details you enter there are processed by Google Gemini).',
          ] },
          { note: 'We never sell or rent your personal information to anyone.' },
        ],
      },
      {
        id: 'device', icon: '💻', title: 'Storage on your device',
        body: ['We use your browser’s storage to remember your cart, keep you signed in and remember light/dark mode. We do not use advertising or analytics trackers.'],
      },
      {
        id: 'security', icon: '🛡️', title: 'Keeping it safe',
        body: ['Passwords are stored encrypted (hashed), never in plain text, and access to customer data is limited to our team.'],
      },
      {
        id: 'rights', icon: '🙋‍♀️', title: 'Your choices',
        body: [`You can ask us to show, correct or delete your personal data at any time — email ${EMAIL}. We keep order records only as long as needed for accounting and legal reasons.`],
      },
      {
        id: 'changes', icon: '🔄', title: 'Changes to this policy',
        body: ['If we change this policy, we will update this page and the date at the top.'],
      },
    ],
  },

  terms: {
    slug: 'terms',
    title: 'Terms & Conditions',
    kicker: 'The small print, made simple',
    intro: 'By shopping at Malo Garments you agree to these terms. We have kept them short and clear.',
    updated: UPDATED,
    highlights: [
      { icon: '🇵🇰', label: 'Prices in PKR', sub: 'all taxes included' },
      { icon: '✔️', label: 'Order confirmation', sub: 'sent by email' },
      { icon: '🤍', label: 'Fair & clear', sub: 'no hidden charges' },
    ],
    sections: [
      {
        id: 'orders', icon: '🛍️', title: 'Orders',
        body: ['Your order is confirmed when you receive our confirmation email. We may cancel an order if an item is out of stock, a price is shown incorrectly, or we cannot verify the order — you will be refunded in full for anything already paid.'],
      },
      {
        id: 'prices', icon: '🏷️', title: 'Prices & payment',
        body: [{ list: [
          'All prices are in Pakistani Rupees (PKR).',
          'We accept Cash on Delivery, NayaPay, EasyPaisa and bank transfer.',
          'Online payments are confirmed once we see the money in our account; the 3% online discount applies to the items.',
          'Discount codes cannot be combined unless stated.',
        ] }],
      },
      {
        id: 'products', icon: '👗', title: 'Products',
        body: ['We show our products as accurately as we can, but colours can look slightly different on different screens. Sizes follow our size guide on each product page.'],
      },
      {
        id: 'custom', icon: '✂️', title: 'Custom designs',
        body: ['Design Studio pieces are made to order for you. Previews are for guidance — the final piece can differ slightly. Custom orders cannot be cancelled once production starts.'],
      },
      {
        id: 'returns-link', icon: '🔁', title: 'Returns, shipping & privacy',
        body: ['Returns, delivery and your personal data are covered by our Returns & Exchanges, Shipping & Delivery and Privacy policies.'],
      },
      {
        id: 'ip', icon: '©️', title: 'Our content',
        body: ['Photos, text, logos and designs on this website belong to Malo Garments and may not be copied without our permission.'],
      },
      {
        id: 'law', icon: '⚖️', title: 'Governing law',
        body: ['These terms are governed by the laws of Pakistan.'],
      },
    ],
  },

  faq: {
    slug: 'faq',
    title: 'Help & FAQ',
    kicker: 'We are here to help',
    intro: 'Quick answers to the questions we hear most. Can’t find yours? Message us on WhatsApp.',
    updated: UPDATED,
    highlights: [
      { icon: '💬', label: 'WhatsApp support', sub: 'Mon – Sat, 10 AM – 9 PM' },
      { icon: '⚡', label: 'Quick replies', sub: 'usually within a few hours' },
      { icon: '📧', label: 'Email us', sub: EMAIL },
    ],
    sections: [],
    faq: [
      { q: 'How long does delivery take?', a: 'Orders are dispatched within 1–2 working days and delivered in 3–5 working days across Pakistan.' },
      { q: 'How much is delivery?', a: 'Delivery is free on orders of Rs. 5,000 and above. Below that it is Rs. 250.' },
      { q: 'Do you offer Cash on Delivery?', a: 'Yes — Cash on Delivery is available everywhere we deliver.' },
      { q: 'How do I pay online and get 3% off?', a: 'Choose NayaPay, EasyPaisa or Bank Transfer at checkout. Send the exact amount shown, then enter the Transaction ID from your receipt on the payment page. We confirm it and email you.' },
      { q: 'Where do I find my Transaction ID?', a: 'It is on the receipt screen in your NayaPay / EasyPaisa / banking app right after you send the money, and in the SMS the app sends you.' },
      { q: 'How do I track my order?', a: 'We email you when your order ships with the expected delivery dates. You can also check your order under My Account.' },
      { q: 'Can I exchange an item?', a: 'Yes, within 7 days of delivery for a different size or colour, as long as it is unworn with tags attached. See our Returns & Exchanges policy for details.' },
      { q: 'Can I return undergarments?', a: 'For hygiene reasons, bras, panties and lingerie can only be exchanged if unopened in the sealed packaging — unless the item is faulty or wrong, which we always replace.' },
      { q: 'How do I choose my size?', a: 'Open “Size Guide & Fit Assistant” on any product page — enter your measurements and it recommends a size.' },
      { q: 'Is the packaging discreet?', a: 'Yes. Every parcel is plain on the outside, with no product description — just your name and address.' },
      { q: 'Can I design my own piece?', a: 'Yes! Try our Design Studio to customise a dress, bra, underwear or nighty and see a live preview before you order.' },
    ],
  },
}

/** Footer / page links, in display order. */
export const POLICY_LINKS = [
  { to: '/faq', label: 'Help & FAQ' },
  { to: '/shipping', label: 'Shipping & Delivery' },
  { to: '/returns', label: 'Returns & Exchanges' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms & Conditions' },
]
