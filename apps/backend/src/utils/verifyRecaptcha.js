const RECAPTCHA_VERIFY_URL =
  "https://www.google.com/recaptcha/api/siteverify";

function getRecaptchaSecret() {
  return String(process.env.RECAPTCHA_SECRET_KEY || "").trim();
}

function isRecaptchaConfigured() {
  return Boolean(getRecaptchaSecret());
}

async function verifyRecaptchaToken(token, options = {}) {
  const secret = getRecaptchaSecret();

  if (!secret) {
    return {
      enabled: false,
      success: true,
      message: "",
    };
  }

  if (!String(token || "").trim()) {
    return {
      enabled: true,
      success: false,
      statusCode: 400,
      message: "Silakan selesaikan verifikasi reCAPTCHA terlebih dahulu",
    };
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: String(token).trim(),
    });

    if (options.remoteIp) {
      body.set("remoteip", String(options.remoteIp));
    }

    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      return {
        enabled: true,
        success: false,
        statusCode: 502,
        message: "Verifikasi reCAPTCHA sedang bermasalah, coba lagi sebentar",
      };
    }

    const payload = await response.json().catch(() => ({}));

    if (!payload?.success) {
      return {
        enabled: true,
        success: false,
        statusCode: 400,
        message: "Verifikasi reCAPTCHA tidak valid, silakan coba lagi",
      };
    }

    return {
      enabled: true,
      success: true,
      statusCode: 200,
      message: "",
    };
  } catch (error) {
    return {
      enabled: true,
      success: false,
      statusCode: 502,
      message: "Verifikasi reCAPTCHA gagal dijalankan, coba lagi sebentar",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

module.exports = {
  isRecaptchaConfigured,
  verifyRecaptchaToken,
};
