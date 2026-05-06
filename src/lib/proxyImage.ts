const PROXY_BASE = 'https://api.tarusin.pro';

const REPLACEMENTS: Array<[string, string]> = [
  ['https://images.unsplash.com/', `${PROXY_BASE}/unsplash/`],
  ['https://i.ytimg.com/', `${PROXY_BASE}/ytimg/`],
  ['https://img.youtube.com/', `${PROXY_BASE}/ytimg/`],
];

export function proxyImage(url: string | null | undefined): string {
  if (!url) return '';
  for (const [from, to] of REPLACEMENTS) {
    if (url.startsWith(from)) return url.replace(from, to);
  }
  return url;
}
