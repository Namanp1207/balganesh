import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "..", "assets", "ganesh-circular.png");

const ORANGE = "#F4511E";
const DARK = "#1A1A1A";
const GRAY = "#6B7280";
const LINE = "#E5E7EB";

/**
 * Streams a landscape/portrait PDF table straight to an Express response.
 * columns: [{ key, label, width }]
 * rows: array of plain objects
 */
export function streamTablePDF(
  res,
  { title, subtitle, columns, rows, filename, generatedAt },
) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);

  const drawHeader = () => {
    doc.rect(0, 0, doc.page.width, 80).fill(ORANGE);
    let textX = 40;
    if (fs.existsSync(LOGO_PATH)) {
      doc.save();
      doc.circle(58, 40, 28).fill("#FFFFFF");
      doc.restore();
      doc.image(LOGO_PATH, 38, 10, { width: 40, height: 60 });
      textX = 90;
    }
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(17)
      .text("Bal Ganesh Mitra Mandal", textX, 22);
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(subtitle || title, textX, 46);
    doc.fillColor(DARK);
  };

  drawHeader();

  doc.moveDown(3);
  doc.font("Helvetica-Bold").fontSize(13).fillColor(DARK).text(title, 40, 100);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(GRAY)
    .text(
      `Generated on ${generatedAt || new Date().toLocaleString("en-IN")}`,
      40,
      118,
    );

  const tableTop = 145;
  const tableLeft = 40;
  const tableWidth = doc.page.width - 80;
  const rowHeight = 24;

  const totalWeight = columns.reduce((sum, c) => sum + c.width, 0);
  const colWidths = columns.map((c) => (c.width / totalWeight) * tableWidth);

  const drawTableHeader = (y) => {
    doc.rect(tableLeft, y, tableWidth, rowHeight).fill("#FFF3EC");
    let x = tableLeft;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(ORANGE);
    columns.forEach((col, i) => {
      doc.text(col.label.toUpperCase(), x + 8, y + 8, {
        width: colWidths[i] - 12,
      });
      x += colWidths[i];
    });
  };

  let y = tableTop;
  drawTableHeader(y);
  y += rowHeight;

  doc.font("Helvetica").fontSize(9.5).fillColor(DARK);

  rows.forEach((row, idx) => {
    if (y + rowHeight > doc.page.height - 60) {
      doc.addPage();
      y = 40;
      drawTableHeader(y);
      y += rowHeight;
      doc.font("Helvetica").fontSize(9.5).fillColor(DARK);
    }

    if (idx % 2 === 1) {
      doc.rect(tableLeft, y, tableWidth, rowHeight).fill("#FAFAFA");
      doc.fillColor(DARK);
    }

    let x = tableLeft;
    columns.forEach((col, i) => {
      const value =
        row[col.key] === null || row[col.key] === undefined
          ? "-"
          : String(row[col.key]);
      doc.text(value, x + 8, y + 7, {
        width: colWidths[i] - 12,
        ellipsis: true,
      });
      x += colWidths[i];
    });

    doc
      .moveTo(tableLeft, y + rowHeight)
      .lineTo(tableLeft + tableWidth, y + rowHeight)
      .strokeColor(LINE)
      .stroke();
    y += rowHeight;
  });

  if (rows.length === 0) {
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(GRAY)
      .text("No records found.", tableLeft, y + 10);
  }

  doc.end();
}
