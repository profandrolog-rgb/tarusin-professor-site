// Общие типы извлечённых артефактов из документов.

export interface ExtractedImage {
  objectKey: string;      // ключ в Yandex Object Storage
  originalFile: string;   // имя исходного файла
  pageOrSlide?: number;   // номер страницы (PDF) или слайда (PPTX)
  index: number;          // порядковый номер в файле
  width: number;
  height: number;
  mime: string;
}

export interface ExtractedTable {
  html: string;
  markdown: string;
  sourceFile: string;
  pageOrSlide?: number;
  index: number;
  caption?: string;
}

export interface ExtractionResult {
  images: ExtractedImage[];
  tables: ExtractedTable[];
}
