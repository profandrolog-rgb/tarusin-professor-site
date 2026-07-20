export type MaterialKind = 'file' | 'youtube' | 'pubmed' | 'url' | 'text';

export function detectUrlKind(url: string): MaterialKind {
  const u = url.trim().toLowerCase();
  if (/youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts/.test(u)) return 'youtube';
  if (/pubmed\.ncbi\.nlm\.nih\.gov|ncbi\.nlm\.nih\.gov\/pmc|europepmc\.org/.test(u)) return 'pubmed';
  if (/^https?:\/\//.test(u)) return 'url';
  return 'text';
}

export function acceptedFileMimes(): string {
  return [
    'application/pdf',
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/mp4', 'audio/x-m4a',
  ].join(',');
}

export function kindLabel(k: MaterialKind): string {
  switch (k) {
    case 'file': return 'Файл';
    case 'youtube': return 'YouTube';
    case 'pubmed': return 'PubMed';
    case 'url': return 'Ссылка';
    case 'text': return 'Текст';
  }
}
