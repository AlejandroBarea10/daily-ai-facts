/**
 * Format day with ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
 */
function getDayWithSuffix(day: number): string {
  if (day > 3 && day < 21) return day + 'th'
  switch (day % 10) {
    case 1:
      return day + 'st'
    case 2:
      return day + 'nd'
    case 3:
      return day + 'rd'
    default:
      return day + 'th'
  }
}

/**
 * Format date as "7th of January"
 */
export function formatDateLong(day: number, month: number): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const monthName = months[month - 1]
  const dayWithSuffix = getDayWithSuffix(day)
  return `${dayWithSuffix} of ${monthName}`
}

/**
 * Get month name from month number
 */
export function getMonthName(month: number): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return months[month - 1]
}
