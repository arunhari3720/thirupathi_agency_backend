
// const PDFDocument = require("pdfkit");

// const generateInvoice = ({
//   order,
//   customer,
//   payment,
// }) => {
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({
//         size: "A4",
//         margin: 50,
//       });

//       const chunks = [];

//       doc.on("data", (chunk) => chunks.push(chunk));

//       doc.on("end", () => {
//         resolve(Buffer.concat(chunks));
//       });

//       doc.on("error", reject);

//       const formatPrice = (amount) =>
//         `Rs. ${Number(amount || 0).toFixed(2)}`;

//       // Company details
//       doc
//         .fontSize(22)
//         .fillColor("#166534")
//         .text("THIRUPATHI AGENCIES");

//       doc
//         .fontSize(10)
//         .fillColor("#555555")
//         .text("Invoice");

//       doc.moveDown(1);

//       doc
//         .fontSize(10)
//         .fillColor("#222222")
//         .text(`Invoice Number: ${order.orderId}`)
//         .text(`Order ID: ${order.orderId}`)
//         .text(`Payment ID: ${payment.razorpayPaymentId}`)
//         .text(`Invoice Date: ${new Date().toLocaleDateString("en-IN")}`)
//         .text(`Payment Status: Paid`);

//       doc.moveDown(1);

//       doc.fontSize(13).text("Bill To");

//       doc
//         .fontSize(10)
//         .text(customer.name || "Customer")
//         .text(customer.email || "");

//       doc.moveDown(2);

//       // Table headings
//       const tableTop = doc.y;
//       const columns = {
//         product: 50,
//         qty: 300,
//         price: 370,
//         subtotal: 465,
//       };

//       doc
//         .fontSize(9)
//         .fillColor("#ffffff");

//       doc.rect(50, tableTop, 495, 25).fill("#166534");

//       doc
//         .fillColor("#ffffff")
//         .text("Product", columns.product + 8, tableTop + 8)
//         .text("Qty", columns.qty, tableTop + 8)
//         .text("Price", columns.price, tableTop + 8)
//         .text("Subtotal", columns.subtotal, tableTop + 8);

//       let y = tableTop + 35;

//       order.items.forEach((item) => {
//         if (y > 700) {
//           doc.addPage();
//           y = 50;
//         }

//         doc
//           .fontSize(9)
//           .fillColor("#222222")
//           .text(item.productName || "Product", columns.product + 8, y, {
//             width: 220,
//           })
//           .text(String(item.qty), columns.qty, y)
//           .text(formatPrice(item.price), columns.price, y)
//           .text(formatPrice(item.subtotal), columns.subtotal, y);

//         y += 30;

//         doc
//           .moveTo(50, y - 8)
//           .lineTo(545, y - 8)
//           .strokeColor("#eeeeee")
//           .stroke();
//       });

//       doc.moveDown(2);

//       doc
//         .fontSize(13)
//         .fillColor("#166534")
//         .text(
//           `Grand Total: ${formatPrice(order.totalAmount)}`,
//           50,
//           Math.max(doc.y, y) + 10,
//           { align: "right" }
//         );

//       doc.moveDown(3);

//       doc
//         .fontSize(10)
//         .fillColor("#555555")
//         .text("Payment Status: PAID")
//         .text(`Payment Method: ${payment.paymentMethod || "Online"}`);

//       doc.moveDown(2);

//       doc
//         .fontSize(9)
//         .fillColor("#888888")
//         .text("Thank you for choosing Thirupathi Agencies!");

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

const BRAND_NAME = "THIRUPATHI AGENCIES";

/* Yellow theme (same as the emails) */
const THEME = {
  yellow: "#FFE45C",
  yellowSoft: "#FFF9D6",
  yellowBorder: "#F5E27A",
  gold: "#B99A00",
  dark: "#171717",
  grey: "#6b7280",
  line: "#e5e7eb",
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

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

const generateInvoice = async ({ order, customer, payment }) => {
  const logo = await getLogo();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      /* ================= HEADER ================= */
      doc.rect(0, 0, PAGE_WIDTH, 115).fill(THEME.yellow);
      doc.rect(0, 115, PAGE_WIDTH, 5).fill(THEME.dark);

      let logoDrawn = false;

      if (logo) {
        try {
          doc.image(logo, 50, 28, { fit: [150, 62] });
          logoDrawn = true;
        } catch {
          logoDrawn = false;
        }
      }

      if (!logoDrawn) {
        doc
          .font("Helvetica-Bold")
          .fontSize(20)
          .fillColor(THEME.dark)
          .text(BRAND_NAME, 50, 44, { lineBreak: false });
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(28)
        .fillColor(THEME.dark)
        .text("INVOICE", 345, 40, { width: 200, align: "right" });

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(THEME.dark)
        .text("Payment receipt", 345, 76, { width: 200, align: "right" });

      /* ================= BILL TO + INVOICE DETAILS ================= */
      const infoTop = 148;

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(THEME.gold)
        .text("BILL TO", 50, infoTop, { lineBreak: false });

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(THEME.dark)
        .text(customer.name || "Customer", 50, infoTop + 18, { width: 240 });

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(THEME.grey)
        .text(customer.email || "", 50, doc.y + 2, { width: 240 });

      const detailRows = [
        ["Invoice No.", String(order.orderId ?? "")],
        ["Order ID", String(order.orderId ?? "")],
        ["Payment ID", String(payment.razorpayPaymentId ?? "")],
        ["Invoice Date", new Date().toLocaleDateString("en-IN")],
        ["Status", "Paid"],
      ];

      let detailY = infoTop;

      detailRows.forEach(([label, value]) => {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor(THEME.grey)
          .text(label, 320, detailY, { width: 75, lineBreak: false });

        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(label === "Status" ? THEME.gold : THEME.dark)
          .text(value, 395, detailY, {
            width: 150,
            align: "right",
            lineBreak: false,
          });

        detailY += 17;
      });

      /* ================= ITEMS TABLE ================= */
      const columns = {
        product: 58,
        qty: 290,
        price: 350,
        subtotal: 445,
      };

      const drawTableHeader = (top) => {
        doc.rect(50, top, 495, 26).fill(THEME.yellow);

        doc.font("Helvetica-Bold").fontSize(9).fillColor(THEME.dark);

        doc.text("Product", columns.product, top + 9, { lineBreak: false });
        doc.text("Qty", columns.qty, top + 9, {
          width: 40,
          align: "center",
          lineBreak: false,
        });
        doc.text("Price", columns.price, top + 9, {
          width: 85,
          align: "right",
          lineBreak: false,
        });
        doc.text("Subtotal", columns.subtotal, top + 9, {
          width: 92,
          align: "right",
          lineBreak: false,
        });
      };

      const tableTop = Math.max(detailY, doc.y) + 24;

      drawTableHeader(tableTop);

      let y = tableTop + 38;

      (order.items || []).forEach((item) => {
        if (y > 700) {
          doc.addPage();
          drawTableHeader(50);
          y = 88;
        }

        doc.font("Helvetica").fontSize(9).fillColor(THEME.dark);

        doc.text(item.productName || "Product", columns.product, y, {
          width: 220,
        });
        doc.text(String(item.qty), columns.qty, y, {
          width: 40,
          align: "center",
          lineBreak: false,
        });
        doc.text(formatPrice(item.price), columns.price, y, {
          width: 85,
          align: "right",
          lineBreak: false,
        });

        doc
          .font("Helvetica-Bold")
          .text(formatPrice(item.subtotal), columns.subtotal, y, {
            width: 92,
            align: "right",
            lineBreak: false,
          });

        y += 30;

        doc
          .moveTo(50, y - 8)
          .lineTo(545, y - 8)
          .lineWidth(0.5)
          .strokeColor(THEME.line)
          .stroke();
      });

      /* ================= TOTAL + PAYMENT INFO ================= */
      y += 14;

      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      // Payment info (left)
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(THEME.gold)
        .text("PAYMENT", 50, y, { lineBreak: false });

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(THEME.dark)
        .text("Status: PAID", 50, y + 18, { lineBreak: false })
        .text(`Method: ${payment.paymentMethod || "Online"}`, 50, y + 34, {
          lineBreak: false,
        });

      // Grand total (right)
      doc
        .roundedRect(335, y, 210, 52, 8)
        .lineWidth(1)
        .fillAndStroke(THEME.yellowSoft, THEME.yellowBorder);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(THEME.grey)
        .text("Grand Total", 351, y + 11, { lineBreak: false });

      doc
        .font("Helvetica-Bold")
        .fontSize(17)
        .fillColor(THEME.dark)
        .text(formatPrice(order.totalAmount), 351, y + 26, {
          width: 178,
          align: "right",
          lineBreak: false,
        });

      /* ================= FOOTER ================= */
      const footerTop = PAGE_HEIGHT - 46;

      doc.rect(0, footerTop, PAGE_WIDTH, 46).fill(THEME.dark);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(THEME.yellow)
        .text(
          "Thank you for choosing Thirupathi Agencies!",
          0,
          footerTop + 17,
          { width: PAGE_WIDTH, align: "center", lineBreak: false }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generateInvoice;