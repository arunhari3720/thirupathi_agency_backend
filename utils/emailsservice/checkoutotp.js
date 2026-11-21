
// const BRAND_NAME = "Thirupathi Agencies";

// const escapeHtml = (value = "") =>
//   String(value).replace(/[&<>"']/g, (char) => ({
//     "&": "&amp;",
//     "<": "&lt;",
//     ">": "&gt;",
//     '"': "&quot;",
//     "'": "&#39;",
//   })[char]);

// const sendCheckoutOtpEmail = async ({ email, name, otp }) => {
//   if (!process.env.BREVO_API_KEY) {
//     throw new Error("BREVO_API_KEY is missing");
//   }

//   if (!process.env.BREVO_SENDER_EMAIL) {
//     throw new Error("BREVO_SENDER_EMAIL is missing");
//   }

//   const safeName = escapeHtml(name || "Customer");
//   const safeOtp = escapeHtml(otp);

//   const payload = {
//     sender: {
//       name: process.env.BREVO_SENDER_NAME || BRAND_NAME,
//       email: process.env.BREVO_SENDER_EMAIL,
//     },

//     to: [
//       {
//         email,
//         name: name || email,
//       },
//     ],

//     subject: `Checkout Verification OTP - ${BRAND_NAME}`,

//     htmlContent: `
//       <div style="font-family:Arial;background:#FFF9D6;padding:30px;">
//         <h2>${BRAND_NAME}</h2>

//         <h3>Email Verification</h3>

//         <p>Hi ${safeName},</p>

//         <p>Use this OTP to continue your checkout.</p>

//         <h1 style="letter-spacing:10px;color:#171717;">
//           ${safeOtp}
//         </h1>

//         <p>This OTP is valid for 5 minutes.</p>

//         <p>Do not share this OTP with anyone.</p>

//         <p>Thank you,<br/>${BRAND_NAME}</p>
//       </div>
//     `,
//   };

//   const response = await fetch(
//     "https://api.brevo.com/v3/smtp/email",
//     {
//       method: "POST",
//       headers: {
//         accept: "application/json",
//         "api-key": process.env.BREVO_API_KEY,
//         "content-type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     }
//   );

//   const result = await response.json();

//   if (!response.ok) {
//     throw new Error(
//       result.message || "Checkout OTP sending failed"
//     );
//   }

//   return result;
// };

// module.exports = sendCheckoutOtpEmail;

const BRAND_NAME = "Thirupathi Agencies";

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

const sendCheckoutOtpEmail = async ({ email, name, otp }) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is missing");
  }

  if (!process.env.BREVO_SENDER_EMAIL) {
    throw new Error("BREVO_SENDER_EMAIL is missing");
  }

  const safeName = escapeHtml(name || "Customer");
  const safeOtp = escapeHtml(otp);

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

    subject: `Checkout Verification OTP - ${BRAND_NAME}`,

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

          <!-- Logo Header -->
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
              ${BRAND_NAME}
            </h2>

          </div>

          <!-- Main Content -->
          <div style="padding:30px 25px;">

            <h3 style="
              color:#171717;
              font-size:20px;
              margin:0 0 20px;
            ">
              Email Verification
            </h3>

            <p style="
              font-size:14px;
              line-height:1.7;
              color:#444444;
            ">
              Hi ${safeName},
            </p>

            <p style="
              font-size:14px;
              line-height:1.7;
              color:#555555;
            ">
              Thank you for choosing ${BRAND_NAME}.
              Please use the verification code below
              to continue your checkout.
            </p>

            <!-- OTP Box -->
            <div style="
              background:#f8f8f8;
              border:1px solid #eeeeee;
              border-radius:10px;
              padding:25px 15px;
              text-align:center;
              margin:25px 0;
            ">

              <p style="
                font-size:13px;
                color:#777777;
                margin:0 0 15px;
              ">
                YOUR VERIFICATION CODE
              </p>

              <h1 style="
                letter-spacing:10px;
                color:#171717;
                font-size:32px;
                margin:0;
                font-weight:bold;
              ">
                ${safeOtp}
              </h1>

            </div>

            <p style="
              font-size:14px;
              line-height:1.7;
              color:#555555;
            ">
              This OTP is valid for <strong>5 minutes</strong>.
              Please complete your verification before it expires.
            </p>

            <div style="
              background:#f8f8f8;
              padding:15px;
              border-radius:8px;
              margin-top:20px;
            ">
              <p style="
                font-size:13px;
                line-height:1.7;
                color:#555555;
                margin:0;
              ">
                <strong>Security Notice:</strong>
                Never share this OTP with anyone.
                Our team will never ask you to share your verification code.
              </p>
            </div>

            <p style="
              font-size:14px;
              line-height:1.7;
              margin-top:25px;
              color:#444444;
            ">
              Thank you,<br/>
              <strong>${BRAND_NAME}</strong>
            </p>

          </div>

          <!-- Footer -->
          <div style="
            background:#ffffff;
            border-top:1px solid #eeeeee;
            padding:18px;
            text-align:center;
          ">

            <p style="
              font-size:12px;
              color:#888888;
              margin:0;
            ">
              © ${new Date().getFullYear()} ${BRAND_NAME}.
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
    throw new Error(
      result.message || "Checkout OTP sending failed"
    );
  }

  return result;
};

module.exports = sendCheckoutOtpEmail;
