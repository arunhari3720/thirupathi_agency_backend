
const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });

const formatPrice = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const paymentSuccessEmail = ({
  customerName,
  orderId,
  paymentId,
  paymentMethod,
  invoiceDate,
  items = [],
  totalAmount,
}) => {
  const productRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #eee;">
            ${escapeHtml(item.productName)}
          </td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;">
            ${Number(item.qty || 0)}
          </td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">
            ${formatPrice(item.price)}
          </td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">
            ${formatPrice(item.subtotal)}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#222;">
        <div style="max-width:650px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;">

          <div style="background:#166534;padding:28px;text-align:center;color:#fff;">
            <h1 style="margin:0;font-size:25px;">Thirupathi Agencies</h1>
            <p style="margin:10px 0 0;font-size:15px;">Payment Successful!</p>
          </div>

          <div style="padding:30px;">
            <h2 style="font-size:21px;">Hi ${escapeHtml(customerName)},</h2>

            <p style="line-height:1.7;color:#555;">
              Thank you for your order! Your payment has been received successfully.
              Your invoice is attached to this email as a PDF.
            </p>

            <div style="background:#f0fdf4;padding:18px;border-radius:8px;margin:22px 0;">
              <p style="margin:0 0 8px;color:#166534;font-weight:bold;">
                Payment Confirmed
              </p>
              <h2 style="margin:0;color:#166534;">
                ${formatPrice(totalAmount)}
              </h2>
            </div>

            <h3 style="font-size:17px;">Order Details</h3>

            <p style="color:#555;line-height:1.8;">
              <strong>Order ID:</strong> ${escapeHtml(orderId)}<br/>
              <strong>Payment ID:</strong> ${escapeHtml(paymentId)}<br/>
              <strong>Payment Method:</strong> ${escapeHtml(paymentMethod || "Online")}<br/>
              <strong>Invoice Date:</strong> ${escapeHtml(invoiceDate)}
            </p>

            <h3 style="font-size:17px;margin-top:25px;">Ordered Products</h3>

            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:12px;text-align:left;">Product</th>
                  <th style="padding:12px;text-align:center;">Qty</th>
                  <th style="padding:12px;text-align:right;">Price</th>
                  <th style="padding:12px;text-align:right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
              </tbody>
            </table>

            <div style="text-align:right;padding:20px 0;font-size:18px;">
              <strong>Total: ${formatPrice(totalAmount)}</strong>
            </div>

            <p style="color:#555;line-height:1.7;">
              Please find your invoice attached. If you have any questions
              regarding your order, feel free to contact us.
            </p>

            <p style="margin-top:25px;color:#555;">
              Thank you for choosing <strong>Thirupathi Agencies</strong>!
            </p>
          </div>

          <div style="background:#f8fafc;padding:18px;text-align:center;color:#888;font-size:12px;">
            This is an automated email. Please do not reply directly to this message.
          </div>

        </div>
      </body>
    </html>
  `;
};

module.exports = paymentSuccessEmail;
