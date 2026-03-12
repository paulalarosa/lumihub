export const exportFinancialExcel = (
  data: Record<string, unknown>[],
  fileName: string,
) => {
  if (!data || !data.length) return

  const separator = ','
  const keys = Object.keys(data[0])
  const csvContent =
    keys.join(separator) +
    '\n' +
    data
      .map((row) => {
        return keys
          .map((k) => {
            const cellValue =
              row[k] === null || row[k] === undefined ? '' : row[k]
            let cell =
              cellValue instanceof Date
                ? cellValue.toLocaleString()
                : String(cellValue).replace(/"/g, '""')
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`
            }
            return cell
          })
          .join(separator)
      })
      .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${fileName}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
