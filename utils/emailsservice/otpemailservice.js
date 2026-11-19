const LOGO_URL =
  "https://res.cloudinary.com/gtqzljit/image/upload/v1790821022/pngwing.com.png";

const BRAND_NAME = "Thirupathi Agencies";

/* Yellow theme (same as the estimate email) */
const THEME = {
  yellow: "#FFE45C",
  yellowSoft: "#FFF9D6",
  yellowBorder: "#F5E27A",
  gold: "#B99A00",
  dark: "#171717",
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

const sendOtpEmail = async ({ email, name, otp, purpose }) => {
  const isRegister = purpose === "register";

  const subject = isRegister
    ? `Verify Your Email - ${BRAND_NAME}`
    : `Password Reset OTP - ${BRAND_NAME}`;

  const heading = isRegister
    ? "Email Verification"
    : "Password Reset Verification";

  const message = isRegister
    ? "Use this OTP to complete your registration."
    : "Use this OTP to verify your password reset request.";

  const safeName = escapeHtml(name || "Customer");
  const safeOtp = escapeHtml(otp);
  const safeBrand = escapeHtml(BRAND_NAME);
  const currentYear = new Date().getFullYear();

  const payload = {
    sender: {
      name: process.env.BREVO_SENDER_NAME || BRAND_NAME,
      email: process.env.BREVO_SENDER_EMAIL,
    },

    to: [
      {
        email,
        name: name || email,
      },
    ],

    subject,

    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(subject)}</title>
</head>

<body style="margin:0;padding:0;background:#f7f7f3;font-family:Arial,Helvetica,sans-serif;color:#202124;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="background:#f7f7f3;padding:28px 12px;">
    <tr>
      <td align="center">

        <table role="presentation" width="550" cellspacing="0" cellpadding="0" border="0"
          style="width:100%;max-width:550px;background:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Brand Header (yellow) -->
          <tr>
            <td align="center" style="background:${THEME.yellow};padding:28px 20px;">
              <img
                src="${LOGO_URL}"
                alt="${safeBrand}"
                width="140"
                style="display:block;width:140px;max-width:100%;height:auto;border:0;margin:0 auto;"
              >
            </td>
          </tr>

          <!-- Accent Strip -->
          <tr>
            <td style="height:5px;background:${THEME.dark};font-size:0;line-height:0;">
              &nbsp;
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td align="center" style="padding:32px 28px 12px;">

              <p style="margin:0 0 10px;color:${THEME.gold};font-size:12px;font-weight:bold;letter-spacing:1.5px;">
                ${isRegister ? "VERIFY YOUR EMAIL" : "RESET YOUR PASSWORD"}
              </p>

              <h1 style="margin:0 0 16px;color:${THEME.dark};font-size:24px;line-height:1.3;">
                ${heading}
              </h1>

              <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.8;">
                Hi <strong style="color:${THEME.dark};">${safeName}</strong>,
                ${message}
              </p>

            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td align="center" style="padding:16px 28px 8px;">

              <table role="presentation" cellspacing="0" cellpadding="0" border="0"
                style="background:${THEME.yellowSoft};border:1px dashed ${THEME.gold};border-radius:12px;">
                <tr>
                  <td align="center" style="padding:20px 36px;">
                    <span style="display:block;color:#6b7280;font-size:11px;font-weight:bold;letter-spacing:1.5px;margin-bottom:8px;">
                      YOUR OTP
                    </span>
                    <span style="display:block;color:${THEME.dark};font-size:34px;font-weight:bold;letter-spacing:10px;padding-left:10px;">
                      ${safeOtp}
                    </span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Validity + Safety -->
          <tr>
            <td align="center" style="padding:16px 28px 32px;">

              <p style="margin:0 0 10px;color:#4b5563;font-size:14px;">
                This OTP is valid for <strong style="color:${THEME.dark};">10 minutes</strong>.
                Do not share it with anyone.
              </p>

              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.7;">
                If you did not request this, please ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${THEME.dark};padding:22px 24px;text-align:center;">

              <p style="margin:0 0 6px;color:#ffffff;font-size:15px;font-weight:bold;">
                ${safeBrand}
              </p>

              <p style="margin:0;color:#6b7280;font-size:10px;">
                &copy; ${currentYear} ${safeBrand}. All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`,
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "OTP email sending failed");
  }

  return result;
};

module.exports = sendOtpEmail;