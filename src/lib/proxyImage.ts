// Прокси api.tarusin.pro временно отключён (502). Возвращаем оригинальные URL.
// Если URL уже был переписан на прокси — разворачиваем обратно на источник.
const REVERSE: Array<[string, string]> = [
  ['https://api.tarusin.pro/unsplash/', 'https://images.unsplash.com/'],
  ['https://api.tarusin.pro/ytimg/', 'https://i.ytimg.com/'],
];

export function proxyImage(url: string | null | undefined): string {
  if (!url) return '';
  for (const [from, to] of REVERSE) {
    if (url.startsWith(from)) return url.replace(from, to);
  }
  return url;
}
