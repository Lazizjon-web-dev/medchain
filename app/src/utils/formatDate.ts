/** Formats a date string from 'YY-MM-DD' to 'MMM D, YYYY' format
 * @param dateString - The input date string in 'YY-MM-DD' format
 * @returns The formatted date string in 'MMM D, YYYY' format
 * @throws Will throw an error if the input date string is not in the expected format
 * @example '22-03-15' -> 'Mar 15, 2022'
 * const formattedDate = formatDate('22-03-15')
 * console.log(formattedDate) // Output: 'Mar 15, 2022'
 */
export default function formatDate(dateString: string): string {
  // Split the input string into year, month, and day components
  const parts: string[] = dateString.split('-')
  if (parts.length !== 3) {
    throw new Error('Invalid date format. Expected format: YY-MM-DD')
  }
  const yearShort = parseInt(parts[0] ?? '', 10)
  const monthIndex = parseInt(parts[1] ?? '', 10) - 1 // Month is 0-indexed in Date object
  const day = parseInt(parts[2] ?? '', 10)

  // Determine the full year (assuming 20xx for '22')
  const fullYear = 2000 + yearShort

  // Create a Date object
  const date = new Date(fullYear, monthIndex, day)

  // Format the date using toLocaleDateString with specific options
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }

  return date.toLocaleDateString('en-US', options)
}
