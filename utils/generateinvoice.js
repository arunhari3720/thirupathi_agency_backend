
// // const PDFDocument = require("pdfkit");

// // const generateInvoice = ({
// //   order,
// //   customer,
// //   payment,
// // }) => {
// //   return new Promise((resolve, reject) => {
// //     try {
// //       const doc = new PDFDocument({
// //         size: "A4",
// //         margin: 50,
// //       });

// //       const chunks = [];

// //       doc.on("data", (chunk) => chunks.push(chunk));

// //       doc.on("end", () => {
// //         resolve(Buffer.concat(chunks));
// //       });

// //       doc.on("error", reject);

// //       const formatPrice = (amount) =>
// //         `Rs. ${Number(amount || 0).toFixed(2)}`;

// //       // Company details
// //       doc
// //         .fontSize(22)
// //         .fillColor("#166534")
// //         .text("THIRUPATHI AGENCIES");

// //       doc
// //         .fontSize(10)
// //         .fillColor("#555555")
// //         .text("Invoice");

// //       doc.moveDown(1);

// //       doc
// //         .fontSize(10)
// //         .fillColor("#222222")
// //         .text(`Invoice Number: ${order.orderId}`)
// //         .text(`Order ID: ${order.orderId}`)
// //         .text(`Payment ID: ${payment.razorpayPaymentId}`)
// //         .text(`Invoice Date: ${new Date().toLocaleDateString("en-IN")}`)
// //         .text(`Payment Status: Paid`);

// //       doc.moveDown(1);

// //       doc.fontSize(13).text("Bill To");

// //       doc
// //         .fontSize(10)
// //         .text(customer.name || "Customer")
// //         .text(customer.email || "");

// //       doc.moveDown(2);

// //       // Table headings
// //       const tableTop = doc.y;
// //       const columns = {
// //         product: 50,
// //         qty: 300,
// //         price: 370,
// //         subtotal: 465,
// //       };

// //       doc
// //         .fontSize(9)
// //         .fillColor("#ffffff");

// //       doc.rect(50, tableTop, 495, 25).fill("#166534");

// //       doc
// //         .fillColor("#ffffff")
// //         .text("Product", columns.product + 8, tableTop + 8)
// //         .text("Qty", columns.qty, tableTop + 8)
// //         .text("Price", columns.price, tableTop + 8)
// //         .text("Subtotal", columns.subtotal, tableTop + 8);

// //       let y = tableTop + 35;

// //       order.items.forEach((item) => {
// //         if (y > 700) {
// //           doc.addPage();
// //           y = 50;
// //         }

// //         doc
// //           .fontSize(9)
// //           .fillColor("#222222")
// //           .text(item.productName || "Product", columns.product + 8, y, {
// //             width: 220,
// //           })
// //           .text(String(item.qty), columns.qty, y)
// //           .text(formatPrice(item.price), columns.price, y)
// //           .text(formatPrice(item.subtotal), columns.subtotal, y);

// //         y += 30;

// //         doc
// //           .moveTo(50, y - 8)
// //           .lineTo(545, y - 8)
// //           .strokeColor("#eeeeee")
// //           .stroke();
// //       });

// //       doc.moveDown(2);

// //       doc
// //         .fontSize(13)
// //         .fillColor("#166534")
// //         .text(
// //           `Grand Total: ${formatPrice(order.totalAmount)}`,
// //           50,
// //           Math.max(doc.y, y) + 10,
// //           { align: "right" }
// //         );

// //       doc.moveDown(3);

// //       doc
// //         .fontSize(10)
// //         .fillColor("#555555")
// //         .text("Payment Status: PAID")
// //         .text(`Payment Method: ${payment.paymentMethod || "Online"}`);

// //       doc.moveDown(2);

// //       doc
// //         .fontSize(9)
// //         .fillColor("#888888")
// //         .text("Thank you for choosing Thirupathi Agencies!");

// //       doc.end();
// //     } catch (error) {
// //       reject(error);
// //     }
// //   });
// // };

// // module.exports = generateInvoice;
// const PDFDocument = require("pdfkit");

// const LOGO_URL =
//   "https://res.cloudinary.com/gtqzljit/image/upload/v1790821022/pngwing.com.png";

// const BRAND_NAME = "THIRUPATHI AGENCIES";

// /* Yellow theme (same as the emails) */
// const THEME = {
//   yellow: "#FFE45C",
//   yellowSoft: "#FFF9D6",
//   yellowBorder: "#F5E27A",
//   gold: "#B99A00",
//   dark: "#171717",
//   grey: "#6b7280",
//   line: "#e5e7eb",
// };

// const PAGE_WIDTH = 595.28;
// const PAGE_HEIGHT = 841.89;

// /* Logo is downloaded once and reused */
// let logoBuffer = null;

// const getLogo = async () => {
//   if (logoBuffer) return logoBuffer;

//   try {
//     const response = await fetch(LOGO_URL);

//     if (!response.ok) return null;

//     logoBuffer = Buffer.from(await response.arrayBuffer());
//     return logoBuffer;
//   } catch {
//     return null;
//   }
// };

// const formatPrice = (amount) => `Rs. ${Number(amount || 0).toFixed(2)}`;

// const generateInvoice = async ({ order, customer, payment }) => {
//   const logo = await getLogo();

//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({
//         size: "A4",
//         margin: 50,
//       });

//       const chunks = [];

//       doc.on("data", (chunk) => chunks.push(chunk));
//       doc.on("end", () => resolve(Buffer.concat(chunks)));
//       doc.on("error", reject);

//       /* ================= HEADER ================= */
//       doc.rect(0, 0, PAGE_WIDTH, 115).fill(THEME.yellow);
//       doc.rect(0, 115, PAGE_WIDTH, 5).fill(THEME.dark);

//       let logoDrawn = false;

//       if (logo) {
//         try {
//           doc.image(logo, 50, 28, { fit: [150, 62] });
//           logoDrawn = true;
//         } catch {
//           logoDrawn = false;
//         }
//       }

//       if (!logoDrawn) {
//         doc
//           .font("Helvetica-Bold")
//           .fontSize(20)
//           .fillColor(THEME.dark)
//           .text(BRAND_NAME, 50, 44, { lineBreak: false });
//       }

//       doc
//         .font("Helvetica-Bold")
//         .fontSize(28)
//         .fillColor(THEME.dark)
//         .text("INVOICE", 345, 40, { width: 200, align: "right" });

//       doc
//         .font("Helvetica")
//         .fontSize(10)
//         .fillColor(THEME.dark)
//         .text("Payment receipt", 345, 76, { width: 200, align: "right" });

//       /* ================= BILL TO + INVOICE DETAILS ================= */
//       const infoTop = 148;

//       doc
//         .font("Helvetica-Bold")
//         .fontSize(9)
//         .fillColor(THEME.gold)
//         .text("BILL TO", 50, infoTop, { lineBreak: false });

//       doc
//         .font("Helvetica-Bold")
//         .fontSize(13)
//         .fillColor(THEME.dark)
//         .text(customer.name || "Customer", 50, infoTop + 18, { width: 240 });

//       doc
//         .font("Helvetica")
//         .fontSize(10)
//         .fillColor(THEME.grey)
//         .text(customer.email || "", 50, doc.y + 2, { width: 240 });

//       const detailRows = [
//         ["Invoice No.", String(order.orderId ?? "")],
//         ["Order ID", String(order.orderId ?? "")],
//         ["Payment ID", String(payment.razorpayPaymentId ?? "")],
//         ["Invoice Date", new Date().toLocaleDateString("en-IN")],
//         ["Status", "Paid"],
//       ];

//       let detailY = infoTop;

//       detailRows.forEach(([label, value]) => {
//         doc
//           .font("Helvetica")
//           .fontSize(9)
//           .fillColor(THEME.grey)
//           .text(label, 320, detailY, { width: 75, lineBreak: false });

//         doc
//           .font("Helvetica-Bold")
//           .fontSize(9)
//           .fillColor(label === "Status" ? THEME.gold : THEME.dark)
//           .text(value, 395, detailY, {
//             width: 150,
//             align: "right",
//             lineBreak: false,
//           });

//         detailY += 17;
//       });

//       /* ================= ITEMS TABLE ================= */
//       const columns = {
//         product: 58,
//         qty: 290,
//         price: 350,
//         subtotal: 445,
//       };

//       const drawTableHeader = (top) => {
//         doc.rect(50, top, 495, 26).fill(THEME.yellow);

//         doc.font("Helvetica-Bold").fontSize(9).fillColor(THEME.dark);

//         doc.text("Product", columns.product, top + 9, { lineBreak: false });
//         doc.text("Qty", columns.qty, top + 9, {
//           width: 40,
//           align: "center",
//           lineBreak: false,
//         });
//         doc.text("Price", columns.price, top + 9, {
//           width: 85,
//           align: "right",
//           lineBreak: false,
//         });
//         doc.text("Subtotal", columns.subtotal, top + 9, {
//           width: 92,
//           align: "right",
//           lineBreak: false,
//         });
//       };

//       const tableTop = Math.max(detailY, doc.y) + 24;

//       drawTableHeader(tableTop);

//       let y = tableTop + 38;

//       (order.items || []).forEach((item) => {
//         if (y > 700) {
//           doc.addPage();
//           drawTableHeader(50);
//           y = 88;
//         }

//         doc.font("Helvetica").fontSize(9).fillColor(THEME.dark);

//         doc.text(item.productName || "Product", columns.product, y, {
//           width: 220,
//         });
//         doc.text(String(item.qty), columns.qty, y, {
//           width: 40,
//           align: "center",
//           lineBreak: false,
//         });
//         doc.text(formatPrice(item.price), columns.price, y, {
//           width: 85,
//           align: "right",
//           lineBreak: false,
//         });

//         doc
//           .font("Helvetica-Bold")
//           .text(formatPrice(item.subtotal), columns.subtotal, y, {
//             width: 92,
//             align: "right",
//             lineBreak: false,
//           });

//         y += 30;

//         doc
//           .moveTo(50, y - 8)
//           .lineTo(545, y - 8)
//           .lineWidth(0.5)
//           .strokeColor(THEME.line)
//           .stroke();
//       });

//       /* ================= TOTAL + PAYMENT INFO ================= */
//       y += 14;

//       if (y > 720) {
//         doc.addPage();
//         y = 50;
//       }

//       // Payment info (left)
//       doc
//         .font("Helvetica-Bold")
//         .fontSize(9)
//         .fillColor(THEME.gold)
//         .text("PAYMENT", 50, y, { lineBreak: false });

//       doc
//         .font("Helvetica")
//         .fontSize(10)
//         .fillColor(THEME.dark)
//         .text("Status: PAID", 50, y + 18, { lineBreak: false })
//         .text(`Method: ${payment.paymentMethod || "Online"}`, 50, y + 34, {
//           lineBreak: false,
//         });

//       // Grand total (right)
//       doc
//         .roundedRect(335, y, 210, 52, 8)
//         .lineWidth(1)
//         .fillAndStroke(THEME.yellowSoft, THEME.yellowBorder);

//       doc
//         .font("Helvetica")
//         .fontSize(9)
//         .fillColor(THEME.grey)
//         .text("Grand Total", 351, y + 11, { lineBreak: false });

//       doc
//         .font("Helvetica-Bold")
//         .fontSize(17)
//         .fillColor(THEME.dark)
//         .text(formatPrice(order.totalAmount), 351, y + 26, {
//           width: 178,
//           align: "right",
//           lineBreak: false,
//         });

//       /* ================= FOOTER ================= */
//       const footerTop = PAGE_HEIGHT - 46;

//       doc.rect(0, footerTop, PAGE_WIDTH, 46).fill(THEME.dark);

//       doc
//         .font("Helvetica-Bold")
//         .fontSize(10)
//         .fillColor(THEME.yellow)
//         .text(
//           "Thank you for choosing Thirupathi Agencies!",
//           0,
//           footerTop + 17,
//           { width: PAGE_WIDTH, align: "center", lineBreak: false }
//         );

//       doc.end();
//     } catch (error) {
//       reject(error);
//     }
//   });
// };

// module.exports = generateInvoice;


const PDFDocument = require("pdfkit");

const LOGO_URL =
  "https://res.cloudinary.com/gtqzljit/image/upload/v1790821022/pngwing.com.png";

/* ---------- Seller (Sold By) details ---------- */
const SELLER = {
  name: "THIRUPATHI AGENCIES",
  gstin: "33BQMPA7248F1ZY",
  fssai: "12421012002436",
  // Address irundha inga lines add pannunga, e.g. ["12, Main Road", "Madurai - 625001"]
  address: [],
};

/* White theme with yellow accents (same as the email) */
const THEME = {
  yellow: "#FFE45C",
  yellowBorder: "#F5E27A",
  gold: "#967B00",
  dark: "#171717",
  grey: "#6b7280",
  line: "#e5e7eb",
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const RIGHT = PAGE_WIDTH - MARGIN;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

/* Logo is downloaded once and reused */
let logoBuffer = null;

const getLogo = async () => {
  if (logoBuffer) return logoBuffer;

  try {
    const response = await fetch(LOGO_URL);
    if (!response.ok) return null;

    logoBuffer = Buffer.from(await response.arrayBuffer());
    return logoBuffer;
  } catch {
    return null;
  }
};

const formatPrice = (amount) => `Rs. ${Number(amount || 0).toFixed(2)}`;

const formatDate = (date) =>
  new Date(date || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* Shrinks the font until the text fits in maxWidth (prevents overlap) */
const fitFont = (doc, text, maxWidth, startSize, font) => {
  let size = startSize;
  doc.font(font).fontSize(size);

  while (doc.widthOfString(String(text)) > maxWidth && size > 6) {
    size -= 0.5;
    doc.fontSize(size);
  }

  return size;
};

const generateInvoice = async ({ order, customer = {}, payment }) => {
  const logo = await getLogo();

  return new Promise((resolve, reject) => {
    try {
      // margin 0 + explicit coordinates => pdfkit never adds blank pages by itself
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        bufferPages: true,
      });

      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const items = order.items || [];
      const invoiceNo = String(order.orderId ?? "-");
      const invoiceDate = formatDate(payment.createdAt);

      /* ================= HEADER ================= */
      doc.rect(0, 96, PAGE_WIDTH, 4).fill(THEME.yellow);

      let textX = MARGIN;

      if (logo) {
        try {
          const img = doc.openImage(logo);
          const scale = Math.min(110 / img.width, 56 / img.height);
          const w = img.width * scale;
          const h = img.height * scale;

          doc.image(img, MARGIN, 20 + (56 - h) / 2, { width: w, height: h });
          textX = MARGIN + w + 12;
        } catch {
          textX = MARGIN;
        }
      }

      // Brand name beside the logo
      fitFont(doc, SELLER.name, 250, 18, "Helvetica-Bold");
      doc.fillColor(THEME.dark).text(SELLER.name, textX, 40, {
        lineBreak: false,
      });

      // Title (right)
      doc
        .font("Helvetica-Bold")
        .fontSize(24)
        .fillColor(THEME.dark)
        .text("INVOICE", RIGHT - 200, 34, {
          width: 200,
          align: "right",
          lineBreak: false,
        });

      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(THEME.grey)
        .text("Payment receipt", RIGHT - 200, 62, {
          width: 200,
          align: "right",
          lineBreak: false,
        });

      /* ================= SOLD BY | BILL TO ================= */
      const blockTop = 122;
      const colWidth = 245;
      const leftX = MARGIN;
      const rightX = MARGIN + 270;

      const drawBlock = (x, label, name, lines) => {
        let by = blockTop;

        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(THEME.gold)
          .text(label, x, by, { lineBreak: false });

        by += 16;
        fitFont(doc, name, colWidth, 12.5, "Helvetica-Bold");
        doc.fillColor(THEME.dark).text(name, x, by, { lineBreak: false });

        by += 20;
        doc.font("Helvetica").fontSize(9.5).fillColor(THEME.grey);

        lines.forEach((line) => {
          const text = String(line);
          doc.text(text, x, by, { width: colWidth });
          by += doc.heightOfString(text, { width: colWidth }) + 3;
        });

        return by;
      };

      const soldByEnd = drawBlock(leftX, "SOLD BY", SELLER.name, [
        ...SELLER.address,
        `GSTIN: ${SELLER.gstin}`,
        `FSSAI No: ${SELLER.fssai}`,
      ]);

      const billToEnd = drawBlock(
        rightX,
        "BILL TO",
        customer.name || "Customer",
        [customer.email, customer.phone, customer.address].filter(Boolean)
      );

      const blockEnd = Math.max(soldByEnd, billToEnd);

      // vertical divider between the two blocks
      doc
        .moveTo(MARGIN + 257, blockTop - 4)
        .lineTo(MARGIN + 257, blockEnd)
        .lineWidth(0.75)
        .strokeColor(THEME.line)
        .stroke();

      /* ================= INVOICE DETAILS BOX ================= */
      const boxTop = blockEnd + 20;
      const boxHeight = 104;
      const splitX = MARGIN + 310;

      doc
        .roundedRect(MARGIN, boxTop, CONTENT_WIDTH, boxHeight, 6)
        .lineWidth(1)
        .fillAndStroke("#ffffff", THEME.yellowBorder);

      doc
        .moveTo(splitX, boxTop + 12)
        .lineTo(splitX, boxTop + boxHeight - 12)
        .lineWidth(0.75)
        .strokeColor(THEME.line)
        .stroke();

      const leftDetails = [
        ["INVOICE NO.", invoiceNo],
        ["ORDER ID", invoiceNo],
        ["PAYMENT ID", String(payment.razorpayPaymentId ?? "-")],
      ];

      const rightDetails = [
        ["INVOICE DATE", invoiceDate],
        ["PAYMENT STATUS", "Paid"],
        ["PAYMENT METHOD", payment.paymentMethod || "Online"],
      ];

      const drawDetails = (rows, x, maxWidth) => {
        rows.forEach(([label, value], i) => {
          const yy = boxTop + 14 + i * 30;

          doc
            .font("Helvetica")
            .fontSize(7.5)
            .fillColor(THEME.grey)
            .text(label, x, yy, { lineBreak: false });

          fitFont(doc, value, maxWidth, 10, "Helvetica-Bold");
          doc
            .fillColor(label === "PAYMENT STATUS" ? THEME.gold : THEME.dark)
            .text(String(value), x, yy + 11, { lineBreak: false });
        });
      };

      drawDetails(leftDetails, MARGIN + 16, 280);
      drawDetails(rightDetails, splitX + 18, 165);

      /* ================= ITEMS TABLE ================= */
      const cols = {
        no: { x: 40, w: 30 },
        product: { x: 78, w: 218 },
        qty: { x: 300, w: 50 },
        price: { x: 355, w: 90 },
        subtotal: { x: 450, w: 97 },
      };

      const drawTableHeader = (top) => {
        doc.font("Helvetica-Bold").fontSize(9).fillColor(THEME.dark);

        doc.text("#", cols.no.x, top + 9, {
          width: cols.no.w,
          align: "center",
          lineBreak: false,
        });
        doc.text("Product", cols.product.x, top + 9, { lineBreak: false });
        doc.text("Qty", cols.qty.x, top + 9, {
          width: cols.qty.w,
          align: "center",
          lineBreak: false,
        });
        doc.text("Price", cols.price.x, top + 9, {
          width: cols.price.w,
          align: "right",
          lineBreak: false,
        });
        doc.text("Subtotal", cols.subtotal.x, top + 9, {
          width: cols.subtotal.w,
          align: "right",
          lineBreak: false,
        });

        doc.rect(MARGIN, top + 27, CONTENT_WIDTH, 2).fill(THEME.yellow);
      };

      let tableTop = boxTop + boxHeight + 22;
      drawTableHeader(tableTop);

      let y = tableTop + 29;

      items.forEach((item, index) => {
        const name = item.productName || "Product";

        doc.font("Helvetica").fontSize(9);
        const textHeight = doc.heightOfString(name, { width: cols.product.w });
        const rowHeight = Math.max(30, textHeight + 20);

        // new page if the row would run into the footer
        if (y + rowHeight > PAGE_HEIGHT - 120) {
          doc.addPage();
          tableTop = 40;
          drawTableHeader(tableTop);
          y = tableTop + 29;
        }

        const textY = y + (rowHeight - textHeight) / 2;
        const singleY = y + (rowHeight - 9) / 2;
        const subtotal =
          item.subtotal ?? Number(item.price || 0) * Number(item.qty || 0);

        doc.font("Helvetica").fontSize(9).fillColor(THEME.grey);
        doc.text(String(index + 1), cols.no.x, singleY, {
          width: cols.no.w,
          align: "center",
          lineBreak: false,
        });

        doc.fillColor(THEME.dark);
        doc.text(name, cols.product.x, textY, { width: cols.product.w });
        doc.text(String(item.qty ?? 0), cols.qty.x, singleY, {
          width: cols.qty.w,
          align: "center",
          lineBreak: false,
        });
        doc.text(formatPrice(item.price), cols.price.x, singleY, {
          width: cols.price.w,
          align: "right",
          lineBreak: false,
        });

        doc
          .font("Helvetica-Bold")
          .text(formatPrice(subtotal), cols.subtotal.x, singleY, {
            width: cols.subtotal.w,
            align: "right",
            lineBreak: false,
          });

        y += rowHeight;

        doc
          .moveTo(MARGIN, y)
          .lineTo(RIGHT, y)
          .lineWidth(0.5)
          .strokeColor(THEME.line)
          .stroke();
      });

      /* ================= TOTAL + NOTE ================= */
      y += 24;

      if (y > PAGE_HEIGHT - 150) {
        doc.addPage();
        y = 50;
      }

      // Note (left)
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(THEME.gold)
        .text("NOTE", MARGIN, y, { lineBreak: false });

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(THEME.grey)
        .text("This is a computer generated invoice and", MARGIN, y + 16, {
          lineBreak: false,
        })
        .text("does not require a signature.", MARGIN, y + 29, {
          lineBreak: false,
        });

      // Grand total (right)
      const totalW = 220;
      const totalX = RIGHT - totalW;

      doc
        .roundedRect(totalX, y - 4, totalW, 54, 8)
        .lineWidth(1)
        .fillAndStroke("#ffffff", THEME.yellowBorder);

      doc.rect(totalX + 8, y + 46, totalW - 16, 3).fill(THEME.yellow);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(THEME.grey)
        .text("Grand Total", totalX + 16, y + 8, { lineBreak: false });

      const totalText = formatPrice(order.totalAmount);
      fitFont(doc, totalText, totalW - 32, 17, "Helvetica-Bold");
      doc.fillColor(THEME.dark).text(totalText, totalX + 16, y + 22, {
        width: totalW - 32,
        align: "right",
        lineBreak: false,
      });

      /* ================= FOOTER (every page) ================= */
      const range = doc.bufferedPageRange();

      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);

        const footerTop = PAGE_HEIGHT - 62;

        doc.rect(0, footerTop, PAGE_WIDTH, 3).fill(THEME.yellow);

        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(THEME.dark)
          .text("Thank you for choosing Thirupathi Agencies!", 0, footerTop + 18, {
            width: PAGE_WIDTH,
            align: "center",
            lineBreak: false,
          });

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(THEME.grey)
          .text(
            `GSTIN: ${SELLER.gstin}   |   FSSAI No: ${SELLER.fssai}`,
            0,
            footerTop + 36,
            { width: PAGE_WIDTH, align: "center", lineBreak: false }
          );

        if (range.count > 1) {
          doc.text(
            `Page ${i + 1} of ${range.count}`,
            RIGHT - 100,
            footerTop + 36,
            { width: 100, align: "right", lineBreak: false }
          );
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generateInvoice;