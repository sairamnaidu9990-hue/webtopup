function pad(value) {
  return String(value).padStart(2, "0");
}

function formatBangjeffTimestamp(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid BangJeff timestamp");
  }

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  const timezoneOffsetMinutes = -date.getTimezoneOffset();
  const sign = timezoneOffsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(timezoneOffsetMinutes);
  const offsetHours = pad(Math.floor(absoluteOffset / 60));
  const offsetMinutes = pad(absoluteOffset % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMinutes}`;
}

module.exports = formatBangjeffTimestamp;
