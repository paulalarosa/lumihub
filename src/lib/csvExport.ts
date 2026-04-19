type PrimitiveValue = string | number | boolean | null | undefined

export interface CsvColumn<T> {
  key: string
  header: string
  value: (row: T) => PrimitiveValue
}

function escapeCsv(input: PrimitiveValue): string {
  if (input === null || input === undefined) return ''
  const str = String(input)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsv(c.header)).join(',')
  const body = rows.map((row) =>
    columns.map((col) => escapeCsv(col.value(row))).join(','),
  )
  return '\uFEFF' + [header, ...body].join('\n')
}

export function downloadCsv(
  filename: string,
  csvContent: string,
): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
): void {
  downloadCsv(filename, buildCsv(rows, columns))
}
