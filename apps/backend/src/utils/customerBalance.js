const Customer = require("../models/Customer");
const CustomerBalanceTransaction = require("../models/CustomerBalanceTransaction");

function toStringValue(value) {
  return String(value || "").trim();
}

function toPositiveAmount(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.round(parsed);
}

function serializeCustomerBalanceTransaction(transaction) {
  return {
    id: String(transaction?._id || ""),
    type: toStringValue(transaction?.type),
    source: toStringValue(transaction?.source),
    amount: Number(transaction?.amount || 0),
    currency: toStringValue(transaction?.currency || "IDR") || "IDR",
    balanceBefore: Number(transaction?.balanceBefore || 0),
    balanceAfter: Number(transaction?.balanceAfter || 0),
    description: toStringValue(transaction?.description),
    invoiceNumber: toStringValue(transaction?.invoiceNumber),
    orderId: transaction?.order ? String(transaction.order) : "",
    createdByAdmin: transaction?.createdByAdmin
      ? String(transaction.createdByAdmin)
      : "",
    createdAt: transaction?.createdAt || null,
    updatedAt: transaction?.updatedAt || null,
  };
}

async function creditCustomerBalance({
  customerId,
  amount,
  currency = "IDR",
  source = "MANUAL",
  description = "",
  orderId = null,
  invoiceNumber = "",
  createdByAdmin = null,
}) {
  const safeAmount = toPositiveAmount(amount);

  if (safeAmount <= 0) {
    throw new Error("Nominal saldo tidak valid");
  }

  const customer = await Customer.findByIdAndUpdate(
    customerId,
    { $inc: { balance: safeAmount } },
    { new: true, runValidators: true }
  );

  if (!customer) {
    throw new Error("User tidak ditemukan");
  }

  const balanceAfter = Number(customer.balance || 0);
  const balanceBefore = balanceAfter - safeAmount;

  const transaction = await CustomerBalanceTransaction.create({
    customer: customer._id,
    type: "CREDIT",
    source,
    amount: safeAmount,
    currency: toStringValue(currency || "IDR") || "IDR",
    balanceBefore,
    balanceAfter,
    description: toStringValue(description),
    order: orderId,
    invoiceNumber: toStringValue(invoiceNumber),
    createdByAdmin,
  });

  return {
    customer,
    transaction,
  };
}

async function debitCustomerBalance({
  customerId,
  amount,
  currency = "IDR",
  source = "MANUAL",
  description = "",
  orderId = null,
  invoiceNumber = "",
  createdByAdmin = null,
}) {
  const safeAmount = toPositiveAmount(amount);

  if (safeAmount <= 0) {
    throw new Error("Nominal saldo tidak valid");
  }

  const customer = await Customer.findOneAndUpdate(
    {
      _id: customerId,
      balance: { $gte: safeAmount },
    },
    { $inc: { balance: -safeAmount } },
    { new: true, runValidators: true }
  );

  if (!customer) {
    throw new Error("Saldo KITAGG tidak mencukupi");
  }

  const balanceAfter = Number(customer.balance || 0);
  const balanceBefore = balanceAfter + safeAmount;

  const transaction = await CustomerBalanceTransaction.create({
    customer: customer._id,
    type: "DEBIT",
    source,
    amount: safeAmount,
    currency: toStringValue(currency || "IDR") || "IDR",
    balanceBefore,
    balanceAfter,
    description: toStringValue(description),
    order: orderId,
    invoiceNumber: toStringValue(invoiceNumber),
    createdByAdmin,
  });

  return {
    customer,
    transaction,
  };
}

module.exports = {
  creditCustomerBalance,
  debitCustomerBalance,
  serializeCustomerBalanceTransaction,
};
