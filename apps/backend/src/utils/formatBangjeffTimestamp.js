function pad(value) {
  return String(value).padStart(2, "0");
}

function getFormatterParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  return formatter.formatToParts(date).reduce((accumulator, part) => {
    if (part.type !== "literal") {
      accumulator[part.type] = part.value;
    }

    return accumulator;
  }, {});
}

function getOffset(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  });

  const offsetLabel = formatter
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  if (!offsetLabel || offsetLabel === "GMT") {
    return "+00:00";
  }

  return offsetLabel.replace("GMT", "");
}

function formatBangjeffTimestamp(
  input = new Date(),
  timeZone = process.env.BANGJEFF_TIMEZONE || "Asia/Jakarta"
) {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid BangJeff timestamp");
  }

  const parts = getFormatterParts(date, timeZone);
  const year = parts.year;
  const month = pad(parts.month);
  const day = pad(parts.day);
  const hours = pad(parts.hour);
  const minutes = pad(parts.minute);
  const seconds = pad(parts.second);
  const offset = getOffset(date, timeZone);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
}

module.exports = formatBangjeffTimestamp;
