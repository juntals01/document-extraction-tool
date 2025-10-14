export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD') // split accented characters
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // non-alphanum -> hyphen
    .replace(/^-+|-+$/g, '') // trim hyphens
    .replace(/-{2,}/g, '-'); // collapse multiple hyphens
}
