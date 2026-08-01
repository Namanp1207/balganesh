import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, "..", "assets");
const LOGO_PATH = path.join(ASSETS, "ganesh-circular.png");
const FONTS = path.join(ASSETS, "fonts");
const DEV_FONT_PATH = path.join(FONTS, "NotoSansDevanagari.ttf");
const POPPINS = {
  regular: path.join(FONTS, "Poppins-Regular.ttf"),
  medium: path.join(FONTS, "Poppins-Medium.ttf"),
  semibold: path.join(FONTS, "Poppins-SemiBold.ttf"),
  bold: path.join(FONTS, "Poppins-Bold.ttf"),
  italic: path.join(FONTS, "Poppins-Italic.ttf"),
  boldItalic: path.join(FONTS, "Poppins-BoldItalic.ttf"),
};
const ICONS = {
  pin: path.join(ASSETS, "icons", "pin_white.png"),
  phoneWhite: path.join(ASSETS, "icons", "phone_white.png"),
  phoneDark: path.join(ASSETS, "icons", "phone_dark.png"),
  instagram: path.join(ASSETS, "icons", "instagram_white.png"),
  rupeeOrange: path.join(ASSETS, "icons", "rupee_orange.png"),
  rupeeWhite: path.join(ASSETS, "icons", "rupee_white.png"),
  gift: path.join(ASSETS, "icons", "gift_white.png"),
  user: path.join(ASSETS, "icons", "user_white.png"),
};

const ORANGE = "#F4511E";
const ORANGE_LIGHT = "#FFF3EC";
const DARK = "#1A1A1A";
const BLACK = "#000";
const LINE = "#e36e2a";

// Organization details shown on the receipt — override any of these via
// environment variables without touching this file.
const ORG_NAME_1 = process.env.ORG_NAME_LINE_1 || "BAL GANESH";
const ORG_NAME_2 = process.env.ORG_NAME_LINE_2 || "MITRA MANDAL";
const ORG_TAGLINE = process.env.ORG_TAGLINE || "Serving Society with Devotion";
const ORG_ADDRESS =
  process.env.ORG_ADDRESS || "Prithvi Residency, Anjurpata Bhiwandi - 421308";
const ORG_PHONE_1 = process.env.ORG_PHONE_1 || "+91 9284747180";
const ORG_PHONE_2 = process.env.ORG_PHONE_2 || "+91 8788908979";
// Leave ORG_ESTD_YEAR unset to omit the "ESTD." ribbon entirely.
const ORG_ESTD_YEAR = process.env.ORG_ESTD_YEAR || "";

export function generateReceiptNo(memberId) {
  const year = new Date().getFullYear();
  return `BG-${year}-${String(memberId).padStart(4, "0")}`;
}

// ---- simple original vector icons (line-art, generic, ~13x13pt) ----
// Used only as a fallback for rows where no icon image is supplied.
function iconBuilding(doc, x, y, color) {
  doc.save().lineWidth(1.1).strokeColor(color);
  doc.rect(x + 2, y, 9, 13).stroke();
  doc.rect(x + 4, y + 2.5, 2, 2).stroke();
  doc.rect(x + 7.5, y + 2.5, 2, 2).stroke();
  doc.rect(x + 4, y + 6.5, 2, 2).stroke();
  doc.rect(x + 7.5, y + 6.5, 2, 2).stroke();
  doc.restore();
}
function iconHome(doc, x, y, color) {
  doc.save().lineWidth(1.1).strokeColor(color);
  doc
    .moveTo(x, y + 6)
    .lineTo(x + 6.5, y)
    .lineTo(x + 13, y + 6)
    .stroke();
  doc.rect(x + 1.5, y + 6, 10, 7).stroke();
  doc.restore();
}
function iconCard(doc, x, y, color) {
  doc.save().lineWidth(1.1).strokeColor(color);
  doc.roundedRect(x, y + 1.5, 13, 9, 1.5).stroke();
  doc
    .moveTo(x, y + 4.5)
    .lineTo(x + 13, y + 4.5)
    .stroke();
  doc.restore();
}
function iconCalendar(doc, x, y, color) {
  doc.save().lineWidth(1.1).strokeColor(color);
  doc.roundedRect(x, y + 1.5, 13, 11, 1.5).stroke();
  doc
    .moveTo(x, y + 5)
    .lineTo(x + 13, y + 5)
    .stroke();
  doc
    .moveTo(x + 3.5, y)
    .lineTo(x + 3.5, y + 3)
    .stroke();
  doc
    .moveTo(x + 9.5, y)
    .lineTo(x + 9.5, y + 3)
    .stroke();
  doc.restore();
}
function iconPerson(doc, x, y, color) {
  doc.save().lineWidth(1.1).strokeColor(color);
  doc.circle(x + 6.5, y + 3.5, 3).stroke();
  doc
    .moveTo(x + 1.5, y + 13)
    .bezierCurveTo(x + 1.5, y + 8, x + 11.5, y + 8, x + 11.5, y + 13)
    .stroke();
  doc.restore();
}

/**
 * Streams a donation receipt PDF straight into an HTTP response, built fresh
 * from the member's data every time. Nothing is saved to disk — the file
 * system on most hosts (especially serverless platforms like Vercel) is
 * ephemeral and gets wiped on every redeploy/restart, so relying on a
 * previously-saved file made old receipts disappear after a redeploy.
 * Regenerating on demand from the database means a receipt is always
 * available for as long as the member record exists.
 */
export function streamReceiptPDF(res, member) {
  const doc = new PDFDocument({ size: "A4", margin: 0 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${member.receipt_no}.pdf"`,
  );
  doc.pipe(res);

  const hasIcon = (p) => fs.existsSync(p);
  const hasDevFont = hasIcon(DEV_FONT_PATH);
  const devFont = hasDevFont ? DEV_FONT_PATH : "Helvetica";

  // Poppins (matches the actual website's font) with graceful fallback to the
  // built-in Helvetica family if the font files are ever missing.
  const F = {
    regular: hasIcon(POPPINS.regular) ? POPPINS.regular : "Helvetica",
    medium: hasIcon(POPPINS.medium) ? POPPINS.medium : "Helvetica",
    semibold: hasIcon(POPPINS.semibold) ? POPPINS.semibold : "Helvetica-Bold",
    bold: hasIcon(POPPINS.bold) ? POPPINS.bold : "Helvetica-Bold",
    italic: hasIcon(POPPINS.italic) ? POPPINS.italic : "Helvetica-Oblique",
    boldItalic: hasIcon(POPPINS.boldItalic)
      ? POPPINS.boldItalic
      : "Helvetica-BoldOblique",
  };

  const PAGE_W = doc.page.width;
  const PAGE_H = doc.page.height;
  const M = 18;
  const IM = 32;

  // ---------- Outer decorative border ----------
  doc
    .roundedRect(M, M, PAGE_W - M * 2, PAGE_H - M * 2, 6)
    .lineWidth(1.5)
    .strokeColor(ORANGE)
    .stroke();
  doc
    .roundedRect(M + 6, M + 6, PAGE_W - (M + 6) * 2, PAGE_H - (M + 6) * 2, 4)
    .lineWidth(0.75)
    .strokeColor(ORANGE)
    .stroke();
  function cornerMark(x, y, dx, dy) {
    doc
      .moveTo(x, y)
      .lineTo(x + dx, y)
      .strokeColor(ORANGE)
      .lineWidth(1)
      .stroke();
    doc
      .moveTo(x, y)
      .lineTo(x, y + dy)
      .strokeColor(ORANGE)
      .lineWidth(1)
      .stroke();
  }
  cornerMark(M - 6, M - 6, 16, 16);
  cornerMark(PAGE_W - M + 6, M - 6, -16, 16);
  cornerMark(M - 6, PAGE_H - M + 6, 16, -16);
  cornerMark(PAGE_W - M + 6, PAGE_H - M + 6, -16, -16);

  let y = 50;

  if (hasDevFont) {
    doc
      .font(devFont)
      .fontSize(13)
      .fillColor(ORANGE)
      .text("|| श्री गणेशाय नमः ||", 0, y, { width: PAGE_W, align: "center" });
  }

  y += 30;

  // ---------- ESTD ribbon ----------
  if (ORG_ESTD_YEAR) {
    const ribbonW = 62;
    const ribbonH = 84;
    const ribbonX = PAGE_W - M - ribbonW - 10;
    const ribbonY = M;
    const gap = 3;
    doc
      .save()
      .lineWidth(5) // thinner line
      .strokeColor(LINE)
      .moveTo(ribbonX + gap, ribbonY + gap)
      .lineTo(ribbonX + ribbonW - gap, ribbonY + gap)
      .lineTo(ribbonX + ribbonW - gap, ribbonY + ribbonH - 16)
      .lineTo(ribbonX + ribbonW / 2, ribbonY + ribbonH + 2)
      .lineTo(ribbonX + gap, ribbonY + ribbonH - 16)
      .closePath()
      .stroke()
      .restore();
    doc
      .moveTo(ribbonX + 2, ribbonY + 2)
      .lineTo(ribbonX + ribbonW - 2, ribbonY + 2)
      .lineTo(ribbonX + ribbonW - 2, ribbonY + ribbonH - 16)
      .lineTo(ribbonX + ribbonW / 2, ribbonY + ribbonH + 2)
      .lineTo(ribbonX + 2, ribbonY + ribbonH - 16)
      .closePath()
      .fill(ORANGE);
    doc
      .font(F.bold)
      .fontSize(11)
      .fillColor("#FFFFFF")
      .text("ESTD.", ribbonX, ribbonY + 20, {
        width: ribbonW,
        align: "center",
      });

    doc
      .font(F.bold)
      .fontSize(18)
      .fillColor("#FFFFFF")
      .text(ORG_ESTD_YEAR, ribbonX, ribbonY + 38, {
        width: ribbonW,
        align: "center",
      });
  }

  // ---------- Logo (with solid orange backdrop) + Org name ----------
  const logoSize = 150;
  const logoX = IM;
  const logoY = y + 8;

  const hasLogo = hasIcon(LOGO_PATH);
  if (hasLogo) {
    doc.image(LOGO_PATH, logoX, logoY, {
      width: logoSize,
      height: logoSize + 50,
    });
  }

  const nameX = hasLogo ? logoX + logoSize + 24 : IM;
  const nameWidth = PAGE_W - M - 90 - nameX;

  doc
    .font(F.bold)
    .fontSize(40)
    .fillColor(ORANGE)
    .text(ORG_NAME_1, nameX, logoY + 40, { width: nameWidth });

  doc
    .font(F.bold)
    .fontSize(26)
    .fillColor(ORANGE)
    .text(ORG_NAME_2, nameX + 28, logoY + 83, { width: nameWidth });

  doc
    .font(F.italic)
    .fontSize(12)
    .fillColor(BLACK)
    .text(`~ ${ORG_TAGLINE} ~`, nameX + 30, logoY + 115, { width: nameWidth });

  y = logoY + logoSize + 30;

  // ---------- Donation Receipt ribbon-tag badge (pointed ends) ----------
  const badgeW = 200;
  const badgeH = 32;
  const badgeX = (PAGE_W - badgeW) / 2;
  const notch = 10;
  doc
    .moveTo(badgeX, y)
    .lineTo(badgeX + badgeW, y)
    .lineTo(badgeX + badgeW - notch, y + badgeH / 2)
    .lineTo(badgeX + badgeW, y + badgeH)
    .lineTo(badgeX, y + badgeH)
    .lineTo(badgeX + notch, y + badgeH / 2)
    .closePath()
    .fill(ORANGE);
  doc
    .font(F.bold)
    .fontSize(14)
    .fillColor("#FFFFFF")
    .text("DONATION RECEIPT", badgeX, y + 9, {
      width: badgeW,
      align: "center",
    });

  doc
    .moveTo(IM, y + badgeH / 2)
    .lineTo(badgeX - 14, y + badgeH / 2)
    .strokeColor(ORANGE)
    .lineWidth(1)
    .stroke();
  doc.circle(badgeX - 8, y + badgeH / 2, 3).fill(ORANGE);
  doc
    .moveTo(badgeX + badgeW + 14, y + badgeH / 2)
    .lineTo(PAGE_W - IM, y + badgeH / 2)
    .strokeColor(ORANGE)
    .lineWidth(1)
    .stroke();
  doc.circle(badgeX + badgeW + 8, y + badgeH / 2, 3).fill(ORANGE);

  y += badgeH + 26;

  // ---------- Receipt No / Date row ----------
  doc
    .font(F.bold)
    .fontSize(11)
    .fillColor(DARK)
    .text("Receipt No. :", IM, y, { continued: true });
  doc.font(F.bold).fillColor(ORANGE).text(`  ${member.receipt_no}`);

  const dateStr = new Date(member.contribution_date).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
  const dateLabel = "Date :";
  const dateLabelW = doc.font(F.bold).fontSize(11).widthOfString(dateLabel);
  const dateValW = doc
    .font(F.regular)
    .fontSize(11)
    .widthOfString(`  ${dateStr}`);
  const dateX = PAGE_W - IM - dateLabelW - dateValW;
  doc
    .font(F.bold)
    .fontSize(11)
    .fillColor(DARK)
    .text(dateLabel, dateX, y, { continued: true });
  doc.font(F.regular).fillColor(DARK).text(`  ${dateStr}`);

  y += 22;
  doc
    .moveTo(IM, y)
    .lineTo(PAGE_W - IM, y)
    .strokeColor(LINE)
    .lineWidth(1)
    .stroke();
  y += 20;

  // ---------- Two cards: Donor Details / Donation Details ----------
  const gap = 20;
  const cardW = (PAGE_W - IM * 2 - gap) / 2;
  const card1X = IM;
  const card2X = IM + cardW + gap;
  const cardTopY = y;

  function drawCardHeader(x, label, iconPath) {
    const headerY = cardTopY + 18; // was around +9

    doc.circle(x + 22, headerY + 10, 14).fill(ORANGE);

    if (hasIcon(iconPath)) {
      doc.image(iconPath, x + 15, headerY + 3, {
        width: 14,
        height: 14,
      });
    }

    doc
      .font(F.bold)
      .fontSize(13)
      .fillColor(ORANGE)
      .text(label, x + 44, headerY + 4);
  }
  drawCardHeader(card1X, "DONOR DETAILS", ICONS.user);
  drawCardHeader(card2X, "DONATION DETAILS", ICONS.gift);

  const rowsStartY = cardTopY + 58;
  const rowGap = 8;
  const iconBox = 13;
  const labelColW = 75;
  const valueXOffset = iconBox + 8 + labelColW + 6;
  const valueWidth = cardW - valueXOffset - 16;

  function measureRows(rows) {
    let totalH = 0;
    const heights = rows.map(([, value]) => {
      const h = doc
        .font(F.bold)
        .fontSize(10.5)
        .heightOfString(String(value), { width: valueWidth });
      const rh = Math.max(iconBox, h) + rowGap;
      totalH += rh;
      return rh;
    });
    return { heights, totalH };
  }

  const rupeeAmountStr = `${hasDevFont ? "₹" : "Rs."} ${Number(
    member.amount,
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;
  const phoneDisplay = member.phone.startsWith("+")
    ? member.phone
    : `+91 ${member.phone}`;

  const donorRows = [
    ["Name", `${member.name} ${member.surname}`, "person"],
    ["Mobile", phoneDisplay, "phone"],
    ["Flat No.", member.flat_no, "building"],
    ["Wing", member.wing, "home"],
  ];
  const donationRows = [
    ["Amount", rupeeAmountStr, "rupee"],
    ["Mode", member.payment_mode, "card"],
    ["Date", dateStr, "calendar"],
  ];

  const donorMeasure = measureRows(donorRows);
  const donationMeasure = measureRows(donationRows);

  function drawIcon(kind, x, iconY) {
    if (kind === "phone" && hasIcon(ICONS.phoneDark)) {
      doc.image(ICONS.phoneDark, x, iconY, { width: iconBox, height: iconBox });
    } else if (kind === "rupee" && hasIcon(ICONS.rupeeOrange)) {
      doc.image(ICONS.rupeeOrange, x, iconY, {
        width: iconBox,
        height: iconBox,
      });
    } else if (kind === "person") iconPerson(doc, x, iconY, DARK);
    else if (kind === "building") iconBuilding(doc, x, iconY, DARK);
    else if (kind === "home") iconHome(doc, x, iconY, DARK);
    else if (kind === "card") iconCard(doc, x, iconY, DARK);
    else if (kind === "calendar") iconCalendar(doc, x, iconY, DARK);
  }

  function drawRows(x, rows, heights) {
    let ry = rowsStartY;
    rows.forEach(([label, value, iconKind], i) => {
      drawIcon(iconKind, x + 16, ry + 1);
      doc
        .font(F.semibold)
        .fontSize(10)
        .fillColor(DARK)
        .text(`${label} :`, x + 16 + iconBox + 8, ry + 1, { width: labelColW });
      if (iconKind === "rupee" && hasDevFont) {
        doc
          .font(devFont)
          .fontSize(10.5)
          .fillColor(DARK)
          .text(value, x + 16 + valueXOffset, ry, { width: valueWidth });
      } else {
        doc
          .font(F.regular)
          .fontSize(10.5)
          .fillColor(DARK)
          .text(String(value), x + 16 + valueXOffset, ry, {
            width: valueWidth,
          });
      }
      ry += heights[i];
    });
  }
  drawRows(card1X, donorRows, donorMeasure.heights);
  drawRows(card2X, donationRows, donationMeasure.heights);

  const cardH = 44 + Math.max(donorMeasure.totalH, donationMeasure.totalH) + 14;
  doc
    .roundedRect(card1X, cardTopY, cardW, cardH, 8)
    .strokeColor(LINE)
    .lineWidth(1)
    .stroke();
  doc
    .roundedRect(card2X, cardTopY, cardW, cardH, 8)
    .strokeColor(LINE)
    .lineWidth(1)
    .stroke();

  y = cardTopY + cardH + 24;

  // ---------- Total amount bar ----------
  //
  const barH = 52;
  const barX = IM;
  const barW = PAGE_W - IM * 2;

  // Background
  doc.roundedRect(barX, y, barW, barH, 8).fill(ORANGE_LIGHT);

  // Border
  doc
    .roundedRect(barX, y, barW, barH, 8)
    .lineWidth(1.5)
    .strokeColor(ORANGE)
    .stroke();

  // Rupee circle
  doc.circle(IM + 26, y + barH / 2, 15).fill(ORANGE);

  if (hasIcon(ICONS.rupeeWhite)) {
    doc.image(ICONS.rupeeWhite, IM + 26 - 8, y + barH / 2 - 8, {
      width: 16,
      height: 16,
    });
  }

  doc
    .font(F.bold)
    .fontSize(12)
    .fillColor(DARK)
    .text("TOTAL AMOUNT RECEIVED", IM + 52, y + barH / 2 - 6);

  doc
    .font( F.bold)
    .fontSize(25)
    .fillColor(ORANGE)
    .text(rupeeAmountStr, IM, y + barH / 2 - 12, {
      width: PAGE_W - IM * 2 - 20,
      align: "right",
    });

  y += barH + 34;

  // ---------- Thank you ----------
  doc
    .font(F.boldItalic)
    .fontSize(24)
    .fillColor(ORANGE)
    .text("~ Thank You! ~", 0, y, { width: PAGE_W, align: "center" });

  y += 36;
  doc
    .font(F.regular)
    .fontSize(10.5)
    .fillColor(BLACK)
    .text(
      `For your generous contribution to ${ORG_NAME_1} ${ORG_NAME_2}.\nYour support helps us organize the Ganesh Festival in our building.`,
      IM,
      y,
      { width: PAGE_W - IM * 2, align: "center" },
    );

  // ---------- Footer bar ----------
  const footerH = 65;
  const innerMargin = M + 6;
  const footerY = PAGE_H - M - footerH - 40;
  doc
    .rect(innerMargin, footerY, PAGE_W - innerMargin * 2, footerH)
    .fill(ORANGE);

  const colW = (PAGE_W - innerMargin * 2) / 3;
  function footerCol(i, iconPath, title, lines) {
    const x = innerMargin + colW * i + 20;
    const iconSize = 16;
    if (hasIcon(iconPath)) {
      doc.image(iconPath, x, footerY + 13, {
        width: iconSize,
        height: iconSize,
      });
    }
    const textX = x + iconSize + 10;
    doc
      .font(F.bold)
      .fontSize(9)
      .fillColor("#FFFFFF")
      .text(title, textX, footerY + 12);
    if (title === "FOLLOW US") {
      doc
        .font(F.regular)
        .fontSize(8.5)
        .fillColor("#FFFFFF")
        .text(lines[0], textX, footerY + 26, {
          width: colW - iconSize - 30,
          link: "https://www.instagram.com/shri_bal_ganesh_mandal?igsh=MXVieW40djd3MGNwMQ==",
          underline: true,
        });
    } else {
      doc
        .font(F.regular)
        .fontSize(8.5)
        .fillColor("#FFFFFF")
        .text(lines.filter(Boolean).join("\n"), textX, footerY + 26, {
          width: colW - iconSize - 30,
        });
    }
  }
  footerCol(0, ICONS.pin, "ADDRESS", [
    `${ORG_NAME_1} ${ORG_NAME_2}`,
    ORG_ADDRESS,
  ]);
  footerCol(1, ICONS.phoneWhite, "CONTACT", [ORG_PHONE_1, ORG_PHONE_2]);
  footerCol(2, ICONS.instagram, "FOLLOW US", ["@Balganeshmandal"]);

  // ---------- Bottom Devanagari line ----------
  if (hasDevFont) {
    const bottomY = footerY + footerH + 14;
    doc
      .font(devFont)
      .fontSize(11)
      .fillColor(ORANGE)
      .text("|| गणपती बाप्पा मोरया ||", 0, bottomY, {
        width: PAGE_W,
        align: "center",
      });
  }

  doc.end();
}
