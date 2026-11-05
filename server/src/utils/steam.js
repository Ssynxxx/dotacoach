const STEAM64_OFFSET = 76561197960265728n;

// Menerima Dota/Steam32 ID atau Steam64 ID, mengembalikan Steam32 (string) atau null jika tidak valid.
function toAccountId(input) {
  const s = String(input ?? '').trim();
  if (!/^\d{1,20}$/.test(s)) return null;
  let n = BigInt(s);
  if (n >= STEAM64_OFFSET) n -= STEAM64_OFFSET;
  if (n <= 0n || n > 4294967295n) return null;
  return String(n);
}

module.exports = { toAccountId };
