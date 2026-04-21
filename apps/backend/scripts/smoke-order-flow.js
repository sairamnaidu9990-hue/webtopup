const assert = require("node:assert/strict");

const {
  buildInvoiceUrl,
  getTokopayRawStatus,
  mapBangjeffProviderStatus,
  mapTokopayStatus,
} = require("../src/utils/orderFlow");
const {
  buildWebhookUrls,
  getProductionReadinessWarnings,
  isPublicHttpUrl,
} = require("../src/utils/deploymentConfig");
const {
  createCallbackIpAllowlist,
  extractClientIp,
  parseAllowedIps,
} = require("../src/middleware/callbackSecurity");
const {
  createTokopaySignature,
  verifyTokopayCallbackSignature,
} = require("../src/services/tokopay.service");

function withEnv(overrides, callback) {
  const previousEnv = {};

  for (const [key, value] of Object.entries(overrides)) {
    previousEnv[key] = process.env[key];

    if (value === null || value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = String(value);
    }
  }

  try {
    return callback();
  } finally {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function createResponseRecorder() {
  return {
    locals: {},
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function runTest(name, callback) {
  callback();
  console.log(`PASS ${name}`);
}

runTest("Invoice URL uses public frontend domain", () => {
  const invoiceUrl = withEnv(
    {
      FRONTEND_URL: "https://kitagg.com",
    },
    () => buildInvoiceUrl({ siteDomain: "https://shop.kitagg.com" }, "KIT123")
  );

  assert.equal(invoiceUrl, "https://shop.kitagg.com/invoice/KIT123");
});

runTest("Tokopay status mapping handles unpaid and paid states", () => {
  assert.deepEqual(mapTokopayStatus("pending"), {
    paymentStatus: "UNPAID",
    orderStatus: "UNPAID",
  });
  assert.deepEqual(mapTokopayStatus("Completed"), {
    paymentStatus: "PAID",
    orderStatus: "PAID",
  });
  assert.equal(getTokopayRawStatus({ data: { status: "Success" } }, "check"), "Success");
});

runTest("BangJeff provider status mapping handles success and processing", () => {
  assert.deepEqual(mapBangjeffProviderStatus("SUCCESS"), {
    providerStatus: "SUCCESS",
    orderStatus: "SUCCESS",
  });
  assert.deepEqual(mapBangjeffProviderStatus("PROCESSING"), {
    providerStatus: "PROCESSING",
    orderStatus: "PROCESSING",
  });
});

runTest("Production readiness warning appears for localhost config", () => {
  const warnings = withEnv(
    {
      FRONTEND_URL: "http://localhost:3001",
      BACKEND_PUBLIC_URL: "http://localhost:4000",
    },
    () => getProductionReadinessWarnings({}, true)
  );

  assert.ok(warnings.length >= 2);
});

runTest("Webhook URLs are derived from backend public URL", () => {
  const webhookUrls = withEnv(
    {
      BACKEND_PUBLIC_URL: "https://api.kitagg.com/",
    },
    () => buildWebhookUrls()
  );

  assert.equal(
    webhookUrls.tokopayCallbackUrl,
    "https://api.kitagg.com/api/orders/tokopay/callback"
  );
  assert.equal(
    webhookUrls.bangjeffCallbackUrl,
    "https://api.kitagg.com/api/orders/bangjeff/callback"
  );
});

runTest("Callback IP extraction and allowlist parsing are stable", () => {
  assert.deepEqual(parseAllowedIps("1.1.1.1, 2.2.2.2", ["3.3.3.3"]), [
    "1.1.1.1",
    "2.2.2.2",
    "3.3.3.3",
  ]);

  const extractedIp = extractClientIp({
    headers: {
      "x-forwarded-for": "178.128.104.179, 10.0.0.1",
    },
    ip: "",
    socket: {},
    connection: {},
  });

  assert.equal(extractedIp, "178.128.104.179");
});

runTest("Callback allowlist permits trusted IP and blocks unknown IP", () => {
  withEnv(
    {
      NODE_ENV: "production",
      ALLOW_LOCAL_WEBHOOKS: "false",
      TOKOPAY_CALLBACK_WHITELIST: "178.128.104.179",
    },
    () => {
      const allowlist = createCallbackIpAllowlist({
        providerName: "Tokopay",
        envVarName: "TOKOPAY_CALLBACK_WHITELIST",
      });

      let nextCalled = false;
      allowlist(
        {
          headers: { "x-forwarded-for": "178.128.104.179, 10.0.0.1" },
          ip: "",
          socket: {},
          connection: {},
          method: "POST",
          originalUrl: "/api/orders/tokopay/callback",
          url: "/api/orders/tokopay/callback",
          requestId: "rid-ok",
        },
        createResponseRecorder(),
        () => {
          nextCalled = true;
        }
      );
      assert.equal(nextCalled, true);

      const blockedResponse = createResponseRecorder();
      allowlist(
        {
          headers: { "x-forwarded-for": "8.8.8.8" },
          ip: "",
          socket: {},
          connection: {},
          method: "POST",
          originalUrl: "/api/orders/tokopay/callback",
          url: "/api/orders/tokopay/callback",
          requestId: "rid-block",
        },
        blockedResponse,
        () => {}
      );

      assert.equal(blockedResponse.statusCode, 403);
      assert.equal(blockedResponse.body?.status, false);
    }
  );
});

runTest("Tokopay callback signature helper remains consistent", () => {
  withEnv(
    {
      TOKOPAY_MERCHANT_ID: "M123",
      TOKOPAY_SECRET: "SECRET123",
    },
    () => {
      const signature = createTokopaySignature("M123", "SECRET123", "KIT123");
      assert.equal(
        verifyTokopayCallbackSignature(signature, "KIT123"),
        true
      );
      assert.equal(isPublicHttpUrl("https://kitagg.com"), true);
      assert.equal(isPublicHttpUrl("http://localhost:3000"), false);
    }
  );
});

console.log("Smoke order-payment-provider flow checks passed.");
