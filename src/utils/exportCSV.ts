import { formatDate } from '@/lib/date-utils'
import { logger } from '@/services/logger'

interface ExportColumn<T> {
  key: keyof T
  label: string
  format?: (value: T[keyof T]) => string
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''

  if (value instanceof Date) {
    return formatDate(value, 'dd/MM/yyyy')
  }

  if (typeof value === 'string') {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/
    if (isoDateRegex.test(value)) {
      try {
        return formatDate(value as string, 'dd/MM/yyyy')
      } catch {
        return value as string
      }
    }

    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não'
  }

  return String(value)
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: ExportColumn<T>[],
): { success: boolean; error?: string } {
  if (!data || data.length === 0) {
    return { success: false, error: 'Nenhum dado para exportar' }
  }

  try {
    const exportColumns: ExportColumn<T>[] =
      columns ||
      (Object.keys(data[0]) as (keyof T)[]).map((key) => ({
        key,
        label: String(key),
      }))

    const headers = exportColumns.map((col) => col.label).join(',')

    const rows = data.map((item) =>
      exportColumns
        .map((col) => {
          const value = item[col.key]
          if (col.format) {
            return formatValue(col.format(value))
          }
          return formatValue(value)
        })
        .join(','),
    )

    const csvContent = [headers, ...rows].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    const dateStr = formatDate(new Date(), 'yyyy-MM-dd')
    const finalFilename = filename.includes('.csv')
      ? filename
      : `${filename}_${dateStr}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', finalFilename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return { success: true }
  } catch (error) {
    logger.error(error, 'exportCSV.exportToCSV', { showToast: false })
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido na exportação',
    }
  }
}

export function exportClientsToCSV(
  clients: Array<{
    name: string
    email: string | null
    phone: string | null
    created_at: string
    is_bride?: boolean
    wedding_date?: string | null
  }>,
): { success: boolean; error?: string } {
  return exportToCSV(clients, 'clientes_khaoskontrol', [
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefone' },
    { key: 'is_bride', label: 'Noiva' },
    { key: 'wedding_date', label: 'Data Casamento' },
    { key: 'created_at', label: 'Data Cadastro' },
  ])
}
