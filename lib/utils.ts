import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Helper to convert numbers to words (e.g., 1 -> ONE) */
export function numberToWords(n: number): string {
  const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
  const teens = ["TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

  if (n <= 0) return n.toString();
  if (n < 10) return ones[n];
  if (n < 20) return teens[n - 10];
  if (n < 100) {
    return (tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")).trim();
  }
  if (n < 1000) {
    return (ones[Math.floor(n / 100)] + " HUNDRED" + (n % 100 !== 0 ? " " + numberToWords(n % 100) : "")).trim();
  }
  return `NUMBER ${n}`;
}

/** Formats lesson titles dynamically (e.g., "Lesson One: Title" or just "Lesson One") */
export function formatLessonTitle(title: string | null | undefined, index: number): string {
  const prefix = `LESSON ${numberToWords(index + 1)}`;
  const cleanTitle = (title || "").trim();

  // If title is just "New Lesson" or empty, only show the prefix
  if (!cleanTitle || cleanTitle.toLowerCase() === "new lesson") {
    return prefix;
  }

  // If title already starts with "LESSON X", don't double it (but normalize it)
  if (cleanTitle.toUpperCase().startsWith("LESSON ")) {
    // Check if it already has a colon
    if (cleanTitle.includes(":")) {
      const afterColon = cleanTitle.split(":")[1].trim();
      return `${prefix}: ${afterColon}`;
    }
    // If it's just "LESSON ONE" then return our prefix
    return prefix;
  }

  return `${prefix}: ${cleanTitle}`;
}
