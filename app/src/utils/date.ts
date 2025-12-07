/** Formats a date string from a specified input format to a specified output format
 * @param dateString - The input date string
 * @param inputFormat - The format of the input date string (default is 'YY-MM-DD')
 * @param outputFormat - The desired output format (default is { month: 'short', day: 'numeric', year: 'numeric' })
 * @returns The formatted date string
 * @throws Will throw an error if the input date string is not in the expected format
 * @example '22-03-15' -> 'Mar 15, 2022'
 * const formattedDate = formatDate('22-03-15')
 * console.log(formattedDate) // Output: 'Mar 15, 2022'
 */
export function formatDate(
  dateString: string,
  inputFormat: string = 'YY-MM-DD',
  outputFormat: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  },
): string {
  const formatParts = inputFormat.split(/[-/ ]/)
  const dateParts = dateString.split(/[-/ ]/)

  if (formatParts.length !== dateParts.length) {
    throw new Error('Invalid date format. Expected format: ' + inputFormat)
  }

  let year = 0
  let month = 0
  let day = 0

  formatParts.forEach((part, index) => {
    const value = parseInt(dateParts[index] ?? '', 10)
    switch (part) {
      case 'YY':
        year = 2000 + value
        break
      case 'YYYY':
        year = value
        break
      case 'MM':
        month = value - 1 // Month is 0-indexed in Date object
        break
      case 'DD':
        day = value
        break
      default:
        throw new Error('Unsupported date part: ' + part)
    }
  })

  const date = new Date(year, month, day)
  return date.toLocaleDateString('en-US', outputFormat)
}
