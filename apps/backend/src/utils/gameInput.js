function normalizeGameInputOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option) => ({
      value: String(option?.value || "").trim(),
      title: String(option?.title || "").trim(),
    }))
    .filter((option) => option.value || option.title);
}

function normalizeGameInputs(inputs) {
  if (!Array.isArray(inputs)) {
    return [];
  }

  return inputs
    .map((input) => ({
      name: String(input?.name || "").trim(),
      type: String(input?.type || "text").trim().toLowerCase() || "text",
      title: String(input?.title || input?.name || "").trim(),
      options: normalizeGameInputOptions(input?.options),
      placeholder: String(input?.placeholder || "").trim(),
      minLength: Number.isFinite(Number(input?.minLength))
        ? Number(input.minLength)
        : 0,
      maxLength: Number.isFinite(Number(input?.maxLength))
        ? Number(input.maxLength)
        : 0,
      regexValidation: String(input?.regexValidation || "").trim(),
    }))
    .filter((input) => input.name || input.title);
}

module.exports = {
  normalizeGameInputs,
  normalizeGameInputOptions,
};
