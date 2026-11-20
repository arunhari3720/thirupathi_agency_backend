// template/paymentsuccessfull.js

const LOGO_URL =
  "https://res.cloudinary.com/gtqzljit/image/upload/v1790821022/pngwing.com.png";

const SELLER = {
  name: "Thirupathi Agencies",
  gstin: "33BQMPA7248F1ZY",
  fssai: "12421012002436",
};

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
    .map((item, index) => {
      const subtotal =
        item.subtotal ?? Number(item.price || 0) * Number(item.qty || 0);

      return `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;">
            ${index + 1}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;color:#171717;">
            ${escapeHtml(item.productName)}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#171717;">
            ${Number(item.qty || 0)}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;color:#171717;white-space:nowrap;">
            ${formatPrice(item.price)}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;color:#171717;font-weight:bold;white-space:nowrap;">
            ${formatPrice(subtotal)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;color:#171717;">
        <div style="max-width:650px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- Header -->
          <div style="background:#ffffff;padding:22px 28px;border-bottom:4px solid #FFE45C;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="left" valign="middle">
                  <img src="${LOGO_URL}" alt="${SELLER.name}" height="48"
                       style="display:block;height:48px;width:auto;border:0;" />
                </td>
                <td align="right" valign="middle"
                    style="font-size:20px;font-weight:bold;color:#171717;letter-spacing:0.5px;">
                  INVOICE
                </td>
              </tr>
            </table>
          </div>

          <div style="padding:30px;background:#ffffff;">
            <span style="display:inline-block;background:#ffffff;border:1px solid #F5E27A;color:#967B00;font-size:12px;font-weight:bold;padding:5px 12px;border-radius:20px;">
              PAYMENT SUCCESSFUL
            </span>

            <h2 style="font-size:21px;margin:16px 0 0;color:#171717;">Hi ${escapeHtml(customerName)},</h2>

            <p style="line-height:1.7;color:#6b7280;">
              Thank you for your order! Your payment has been received successfully.
              Your invoice is attached to this email as a PDF.
            </p>

            <!-- Amount box -->
            <div style="background:#ffffff;border:1px solid #e5e7eb;border-left:4px solid #FFE45C;padding:18px;border-radius:8px;margin:22px 0;">
              <p style="margin:0 0 8px;color:#967B00;font-weight:bold;">
                Payment Confirmed
              </p>
              <h2 style="margin:0;color:#171717;">
                ${formatPrice(totalAmount)}
              </h2>
            </div>

            <h3 style="font-size:17px;color:#171717;">Order Details</h3>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="font-size:14px;line-height:1.6;">
              <tr>
                <td style="padding:6px 0;color:#6b7280;width:130px;border-bottom:1px solid #f1f1f1;">Order ID</td>
                <td style="padding:6px 0;font-weight:bold;word-break:break-all;border-bottom:1px solid #f1f1f1;">${escapeHtml(orderId)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;border-bottom:1px solid #f1f1f1;">Payment ID</td>
                <td style="padding:6px 0;font-weight:bold;word-break:break-all;border-bottom:1px solid #f1f1f1;">${escapeHtml(paymentId)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;border-bottom:1px solid #f1f1f1;">Payment Method</td>
                <td style="padding:6px 0;font-weight:bold;border-bottom:1px solid #f1f1f1;">${escapeHtml(paymentMethod || "Online")}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;">Invoice Date</td>
                <td style="padding:6px 0;font-weight:bold;">${escapeHtml(invoiceDate)}</td>
              </tr>
            </table>

            <h3 style="font-size:17px;margin-top:25px;color:#171717;">Ordered Products</h3>

            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:#ffffff;">
                  <th style="padding:12px 8px;text-align:center;width:30px;color:#171717;border-bottom:2px solid #FFE45C;">#</th>
                  <th style="padding:12px 8px;text-align:left;color:#171717;border-bottom:2px solid #FFE45C;">Product</th>
                  <th style="padding:12px 8px;text-align:center;color:#171717;border-bottom:2px solid #FFE45C;">Qty</th>
                  <th style="padding:12px 8px;text-align:right;color:#171717;border-bottom:2px solid #FFE45C;">Price</th>
                  <th style="padding:12px 8px;text-align:right;color:#171717;border-bottom:2px solid #FFE45C;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
              </tbody>
            </table>

            <!-- Total -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
              <tr>
                <td></td>
                <td width="240"
                    style="background:#ffffff;border:1px solid #e5e7eb;border-bottom:3px solid #FFE45C;border-radius:8px;padding:14px 18px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:12px;color:#6b7280;">Grand Total</td>
                      <td align="right"
                          style="font-size:18px;font-weight:bold;color:#171717;white-space:nowrap;">
                        ${formatPrice(totalAmount)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="color:#6b7280;line-height:1.7;margin-top:25px;">
              Please find your invoice attached. If you have any questions
              regarding your order, feel free to contact us.
            </p>

            <p style="margin-top:25px;color:#6b7280;">
              Thank you for choosing <strong style="color:#171717;">${SELLER.name}</strong>!
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#ffffff;border-top:1px solid #e5e7eb;padding:22px 28px;text-align:center;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#171717;">
              ${SELLER.name}
            </p>
            <p style="margin:0;font-size:11px;line-height:18px;color:#6b7280;">
              GSTIN: ${SELLER.gstin} &nbsp;|&nbsp; FSSAI No: ${SELLER.fssai}
            </p>
            <p style="margin:10px 0 0;font-size:11px;color:#9ca3af;">
              This is an automated email. Please do not reply directly to this message.
            </p>
          </div>

        </div>
      </body>
    </html>
  `;
};

module.exports = paymentSuccessEmail;