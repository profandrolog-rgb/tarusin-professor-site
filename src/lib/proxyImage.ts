// Прокси api.tarusin.pro переадресует Unsplash и YouTube CDN (заблокированы в РФ).
const MAP: Array<[string, string]> = [
  ['https://images.unsplash.com/', 'https://api.tarusin.pro/unsplash/'],
  ['https://i.ytimg.com/', 'https://api.tarusin.pro/ytimg/'],
];

export function proxyImage(url: string | null | undefined): string {
  if (!url) return '';
  for (const [from, to] of MAP) {
    if (url.startsWith(from)) return url.replace(from, to);
  }
  return url;
}
