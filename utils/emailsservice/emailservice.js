
const paymentSuccessEmail = require("../template/paymentsuccessfull");

const sendInvoiceEmail = async ({
  customerEmail,
  customerName,
  order,
  payment,
  pdfBuffer,
}) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is missing");
    }

    if (!process.env.BREVO_SENDER_EMAIL) {
      throw new Error("BREVO_SENDER_EMAIL is missing");
    }

    const invoiceDate = new Date().toLocaleDateString("en-IN");

    const htmlContent = paymentSuccessEmail({
      customerName,
      orderId: order.orderId,
      paymentId: payment.razorpayPaymentId,
      paymentMethod: payment.paymentMethod,
      invoiceDate,
      items: order.items,
      totalAmount: order.totalAmount,
    });

    const payload = {
      sender: {
        name: process.env.BREVO_SENDER_NAME || "Thirupathi Agencies",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [
        {
          email: customerEmail,
          name: customerName,
        },
      ],
      subject: `Payment Successful - Order ${order.orderId}`,
      htmlContent,
      attachment: [
        {
          name: `Invoice-${order.orderId}.pdf`,
          content: pdfBuffer.toString("base64"),
        },
      ],
    };

    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Brevo email sending failed"
      );
    }

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Invoice email error:", error.message);

    throw error;
  }
};

module.exports = sendInvoiceEmail;
