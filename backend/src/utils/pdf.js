import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECEIPTS_DIR = path.join(__dirname, "..", "..", "receipts");
const LOGO_PATH = path.join(__dirname, "..", "assets", "ganesh-icon.png");

if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

const ORANGE = "#F4511E";
const DARK = "#1A1A1A";
const GRAY = "#6B7280";

export function generateReceiptNo(memberId) {
  const year = new Date().getFullYear();
  return `BG-${year}-${String(memberId).padStart(4, "0")}`;
}

export function receiptFilePath(receiptNo) {
  return path.join(RECEIPTS_DIR, `${receiptNo}.pdf`);
}

export function generateReceiptPDF(member) {
  return new Promise((resolve, reject) => {
    const filePath = receiptFilePath(member.receipt_no);
    const doc = new PDFDocument({ size: "A5", margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header band
    doc.rect(0, 0, doc.page.width, 100).fill(ORANGE);

    let textX = 40;
    if (fs.existsSync(LOGO_PATH)) {
      // White circular badge behind the logo so it stands out on the orange band
      doc.save();
      doc.circle(58, 50, 26).fill("#FFFFFF");
      doc.restore();
      doc.image(LOGO_PATH, 36, 28, { width: 44, height: 44 });
      textX = 92;
    }

    doc
      .fillColor("#FFFFFF")
      .fontSize(19)
      .font("Helvetica-Bold")
      .text("Bal Ganesh Mitra Mandal", textX, 30, { width: doc.page.width - textX - 40 });
    doc
      .fontSize(11)
      .font("Helvetica")
      .text("Donation Receipt", textX, 58);

    doc.moveDown(4);
    doc.fillColor(DARK);

    doc.fontSize(11).font("Helvetica-Bold").text(`Receipt No: `, 40, 110, { continued: true });
    doc.font("Helvetica").text(member.receipt_no);

    doc.font("Helvetica-Bold").text(`Date: `, 40, 128, { continued: true });
    doc.font("Helvetica").text(new Date(member.contribution_date).toLocaleDateString("en-IN"));

    doc.moveDown(1.5);
    doc.moveTo(40, 155).lineTo(doc.page.width - 40, 155).strokeColor("#E5E7EB").stroke();

    const rows = [
      ["Name", `${member.name} ${member.surname}`],
      ["Phone No.", member.phone],
      ["Flat No.", member.flat_no],
      ["Wing", member.wing],
      ["Payment Mode", member.payment_mode],
    ];

    let y = 172;
    rows.forEach(([label, value]) => {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(GRAY).text(label, 40, y);
      doc.font("Helvetica").fontSize(11).fillColor(DARK).text(String(value), 200, y);
      y += 22;
    });

    y += 10;
    doc.rect(40, y, doc.page.width - 80, 50).fill("#FFF3EC");
    doc
      .fillColor(ORANGE)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`Amount Received: Rs. ${Number(member.amount).toFixed(2)}`, 55, y + 17);

    y += 80;
    doc
      .fillColor(GRAY)
      .fontSize(9)
      .font("Helvetica")
      .text(
        "Thank you for your generous contribution to the Bal Ganesh Mitra Mandal.",
        40,
        y,
        { width: doc.page.width - 80, align: "center" }
      );

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}
