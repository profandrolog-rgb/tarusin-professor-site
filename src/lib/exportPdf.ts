import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Рендерит DOM-узел в многостраничный A4 PDF и сохраняет файл.
 * Используется для выгрузки протоколов, рецептов и пр.
 */
export async function exportNodeToPdf(node: HTMLElement, filename = "document.pdf") {
  // Ждём загрузки шрифтов, чтобы избежать «прыжков» текста
  try { await (document as any).fonts?.ready; } catch {}

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: node.scrollWidth,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pageW) / canvas.width;

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(imgData, "JPEG", 0, position, pageW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) {
    position = heightLeft - imgH;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, pageW, imgH);
    heightLeft -= pageH;
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
