// src/utils/dateHelper.js

/**
 * Formats a given date into Indian-style format: "DD MMM YYYY"
 * Example: 14 Oct 2025
 */
export const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};
