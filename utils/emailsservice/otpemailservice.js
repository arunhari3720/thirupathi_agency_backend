
const sendOtpEmail = async ({ email, name, otp, purpose }) => {
  const subject =
    purpose === "register"
      ? "Verify Your Email - Thirupathi Agencies"
      : "Password Reset OTP - Thirupathi Agencies";

  const heading =
    purpose === "register"
      ? "Email Verification"
      : "Password Reset Verification";

  const message =
    purpose === "register"
      ? "Use this OTP to complete your registration."
      : "Use this OTP to verify your password reset request.";

  const payload = {
    sender: {
      name: process.env.BREVO_SENDER_NAME || "Thirupathi Agencies",
      email: process.env.BREVO_SENDER_EMAIL,
    },

    to: [
      {
        email,
        name: name || email,
      },
    ],

    subject,

    htmlContent: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;padding:25px;">
        <div style="max-width:550px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;">
          <div style="background:#166534;color:white;text-align:center;padding:25px;">
            <h2 style="margin:0;">Thirupathi Agencies</h2>
          </div>

          <div style="padding:30px;text-align:center;">
            <h2>${heading}</h2>
            <p style="color:#555;line-height:1.6;">Hi ${name || "Customer"}, ${message}</p>

            <div style="background:#f0fdf4;padding:20px;border-radius:8px;margin:25px 0;">
              <h1 style="letter-spacing:8px;color:#166534;margin:0;">
                ${otp}
              </h1>
            </div>

            <p style="color:#666;">
              This OTP is valid for 10 minutes.
            </p>

            <p style="color:#999;font-size:12px;">
              If you did not request this, please ignore this email.
            </p>
          </div>
        </div>
      </body>
      </html>
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
    throw new Error(result.message || "OTP email sending failed");
  }

  return result;
};

module.exports = sendOtpEmail;
