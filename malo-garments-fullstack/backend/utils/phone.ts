/*
 * Malo Garments — Phone Normalization
 * Converts local Pakistani numbers (03XX-XXXXXXX) and loose input into E.164
 * (+92XXXXXXXXXX) so Twilio and DB lookups always compare the same format.
 */

export const normalizePhone = (raw: string): string | null => {
  const digits = raw.replace(/[^\d+]/g, '');
  if (!digits) return null;

  if (digits.startsWith('+')) return /^\+\d{8,15}$/.test(digits) ? digits : null;
  if (digits.startsWith('92')) return /^\d{10,13}$/.test(digits) ? `+${digits}` : null;
  if (digits.startsWith('0')) return /^0\d{9,10}$/.test(digits) ? `+92${digits.slice(1)}` : null;

  return /^\d{9,10}$/.test(digits) ? `+92${digits}` : null;
};
