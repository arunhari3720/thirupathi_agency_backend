
const PDFDocument = require("pdfkit");

const generateInvoice = ({
  order,
  customer,
  payment,
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", reject);

      const formatPrice = (amount) =>
        `Rs. ${Number(amount || 0).toFixed(2)}`;

      // Company details
      doc
        .fontSize(22)
        .fillColor("#166534")
        .text("THIRUPATHI AGENCIES");

      doc
        .fontSize(10)
        .fillColor("#555555")
        .text("Invoice");

      doc.moveDown(1);

      doc
        .fontSize(10)
        .fillColor("#222222")
        .text(`Invoice Number: ${order.orderId}`)
        .text(`Order ID: ${order.orderId}`)
        .text(`Payment ID: ${payment.razorpayPaymentId}`)
        .text(`Invoice Date: ${new Date().toLocaleDateString("en-IN")}`)
        .text(`Payment Status: Paid`);

      doc.moveDown(1);

      doc.fontSize(13).text("Bill To");

      doc
        .fontSize(10)
        .text(customer.name || "Customer")
        .text(customer.email || "");

      doc.moveDown(2);

      // Table headings
      const tableTop = doc.y;
      const columns = {
        product: 50,
        qty: 300,
        price: 370,
        subtotal: 465,
      };

      doc
        .fontSize(9)
        .fillColor("#ffffff");

      doc.rect(50, tableTop, 495, 25).fill("#166534");

      doc
        .fillColor("#ffffff")
        .text("Product", columns.product + 8, tableTop + 8)
        .text("Qty", columns.qty, tableTop + 8)
        .text("Price", columns.price, tableTop + 8)
        .text("Subtotal", columns.subtotal, tableTop + 8);

      let y = tableTop + 35;

      order.items.forEach((item) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc
          .fontSize(9)
          .fillColor("#222222")
          .text(item.productName || "Product", columns.product + 8, y, {
            width: 220,
          })
          .text(String(item.qty), columns.qty, y)
          .text(formatPrice(item.price), columns.price, y)
          .text(formatPrice(item.subtotal), columns.subtotal, y);

        y += 30;

        doc
          .moveTo(50, y - 8)
          .lineTo(545, y - 8)
          .strokeColor("#eeeeee")
          .stroke();
      });

      doc.moveDown(2);

      doc
        .fontSize(13)
        .fillColor("#166534")
        .text(
          `Grand Total: ${formatPrice(order.totalAmount)}`,
          50,
          Math.max(doc.y, y) + 10,
          { align: "right" }
        );

      doc.moveDown(3);

      doc
        .fontSize(10)
        .fillColor("#555555")
        .text("Payment Status: PAID")
        .text(`Payment Method: ${payment.paymentMethod || "Online"}`);

      doc.moveDown(2);

      doc
        .fontSize(9)
        .fillColor("#888888")
        .text("Thank you for choosing Thirupathi Agencies!");

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generateInvoice;
