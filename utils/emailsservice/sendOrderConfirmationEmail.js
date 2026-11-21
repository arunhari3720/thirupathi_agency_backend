
const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

const sendOrderConfirmationEmail = async ({ customer, order }) => {
  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #eee;">
        ${escapeHtml(item.productName)}
      </td>
      <td style="padding:12px;text-align:center;border-bottom:1px solid #eee;">
        ${item.qty}
      </td>
      <td style="padding:12px;text-align:right;border-bottom:1px solid #eee;">
        ₹${Number(item.subtotal).toFixed(2)}
      </td>
    </tr>
  `).join("");

  const address = customer.address;

  const payload = {
    sender: {
      name: process.env.BREVO_SENDER_NAME || "Thirupathi Agencies",
      email: process.env.BREVO_SENDER_EMAIL,
    },

    to: [{
      email: customer.email,
      name: customer.name,
    }],

    subject: `Order Request Received - ${order.orderId}`,

    htmlContent: `
      <div style="
        font-family:Arial,Helvetica,sans-serif;
        background:#ffffff;
        padding:30px 15px;
        color:#333333;
      ">

        <div style="
          max-width:600px;
          margin:0 auto;
          background:#ffffff;
          border:1px solid #eeeeee;
          border-radius:12px;
          overflow:hidden;
        ">

          <!-- Logo -->
          <div style="
            text-align:center;
            padding:25px 20px;
            background:#ffffff;
            border-bottom:1px solid #eeeeee;
          ">
            <img
              src="https://res.cloudinary.com/gtqzljit/image/upload/v1790821022/pngwing.com.png"
              alt="Thirupathi Agencies Logo"
              width="130"
              style="
                display:block;
                width:130px;
                max-width:100%;
                height:auto;
                margin:0 auto;
                border:0;
              "
            />
            <h2 style="
              margin:12px 0 0;
              color:#171717;
              font-size:22px;
            ">
              Thirupathi Agencies
            </h2>
          </div>

          <!-- Main Content -->
          <div style="padding:25px;">

            <h3 style="color:#171717;font-size:20px;">
              Thank you for your order request!
            </h3>

            <p style="font-size:14px;line-height:1.7;">
              Hi ${escapeHtml(customer.name)},
            </p>

            <p style="font-size:14px;line-height:1.7;color:#555;">
              Your order request has been created successfully.
              You selected WhatsApp to confirm your order.
            </p>

            <div style="
              background:#f8f8f8;
              padding:15px;
              border-radius:8px;
              margin:20px 0;
            ">
              <strong style="font-size:15px;">
                Order ID: ${escapeHtml(order.orderId)}
              </strong>
            </div>

            <!-- Order Table -->
            <h3 style="font-size:17px;color:#171717;">
              Order Summary
            </h3>

            <table width="100%" cellspacing="0" cellpadding="0"
              style="border-collapse:collapse;font-size:13px;">

              <thead>
                <tr style="background:#f5f5f5;">
                  <th align="left" style="padding:12px;">Product</th>
                  <th style="padding:12px;">Qty</th>
                  <th align="right" style="padding:12px;">Amount</th>
                </tr>
              </thead>

              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="
              text-align:right;
              padding:18px 0;
              border-bottom:1px solid #eeeeee;
            ">
              <strong style="font-size:19px;color:#171717;">
                Total: ₹${Number(order.totalAmount).toFixed(2)}
              </strong>
            </div>

            <!-- Delivery Details -->
            <h3 style="font-size:17px;color:#171717;margin-top:25px;">
              Delivery Details
            </h3>

            <p style="font-size:14px;line-height:1.8;color:#555;">
              ${escapeHtml(address.addressLine)},
              ${escapeHtml(address.city)},
              ${escapeHtml(address.state)} -
              ${escapeHtml(address.pincode)}
            </p>

            <p style="font-size:14px;">
              <strong>Order Method:</strong> WhatsApp
            </p>

            <div style="
              background:#f8f8f8;
              padding:15px;
              border-radius:8px;
              margin-top:20px;
            ">
              <p style="font-size:13px;line-height:1.7;margin:0;color:#555;">
                Please complete your order confirmation through WhatsApp.
                Our team will assist you with the next steps.
              </p>
            </div>

            <p style="
              font-size:14px;
              line-height:1.7;
              margin-top:25px;
            ">
              Thank you for choosing us!<br/>
              <strong>Thirupathi Agencies</strong>
            </p>

          </div>

          <!-- Footer -->
          <div style="
            background:#ffffff;
            border-top:1px solid #eeeeee;
            padding:18px;
            text-align:center;
          ">
            <p style="font-size:12px;color:#888;margin:0;">
              © ${new Date().getFullYear()} Thirupathi Agencies.
              All rights reserved.
            </p>
          </div>

        </div>
      </div>
    `,
  };

  const response = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Order email sending failed");
  }

  return result;
};

module.exports = sendOrderConfirmationEmail;
