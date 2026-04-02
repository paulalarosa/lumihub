import jsPDF from 'jspdf'

import { saveAs } from 'file-saver'
import { format } from 'date-fns/format'

import { ptBR } from 'date-fns/locale'
import { ReportProject, FinancialExportItem } from '@/types/service-types'
import { formatCurrency } from '@/lib/format'

interface Client {
  full_name: string
  phone: string | null
  email: string | null
}

interface _AutoTableDoc extends jsPDF {
  lastAutoTable: { finalY: number }
}

export const generateClientPDF = (
  client: Client,
  projects: ReportProject[],
) => {
  const doc = new jsPDF()

  const colors = {
    primary: '#D4AF37',
    secondary: '#000000',
    text: '#333333',
    textLight: '#808080',
    bgLight: '#F9F9F9',
  }

  doc.setFillColor(colors.secondary)
  doc.rect(0, 0, 210, 50, 'F')

  doc.setTextColor(colors.primary)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('KONTROL', 20, 25)

  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text('EXCELLENCE IN BEAUTY MANAGEMENT // KHAOS STUDIO', 20, 32)

  doc.setFontSize(16)
  doc.setTextColor(colors.primary)
  doc.text('FICHA TÉCNICA DA NOIVA', 130, 25)

  doc.setFontSize(9)
  doc.setTextColor(200, 200, 200)
  doc.text(
    `Gerado em: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`,
    130,
    32,
  )

  let yPos = 65

  doc.setFontSize(12)
  doc.setTextColor(colors.primary)
  doc.text('DADOS DA CLIENTE', 20, yPos)
  doc.setDrawColor(colors.primary)
  doc.line(20, yPos + 2, 80, yPos + 2)

  yPos += 15

  doc.setFontSize(14)
  doc.setTextColor(colors.secondary)
  doc.setFont('helvetica', 'bold')
  doc.text(client.full_name || 'Nome Desconhecido', 20, yPos)

  yPos += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(colors.text)
  doc.text(`Email: ${client.email || 'N/A'}`, 20, yPos)
  doc.text(`Telefone: ${client.phone || 'N/A'}`, 110, yPos)

  yPos += 6
  doc.text(`Cadastrada em: ${format(new Date(), 'dd/MM/yyyy')}`, 20, yPos)

  yPos += 20

  if (!projects || projects.length === 0) {
    doc.setFontSize(10)
    doc.setTextColor(colors.textLight)
    doc.text('Nenhum evento registrado para esta cliente.', 20, yPos)
  } else {
    projects.forEach((project, index) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 30
      }

      doc.setFillColor(colors.primary)
      doc.rect(20, yPos, 2, 18, 'F')

      doc.setFontSize(14)
      doc.setTextColor(colors.secondary)
      doc.setFont('helvetica', 'bold')
      doc.text(project.title || 'Evento Sem Nome', 26, yPos + 8)

      doc.setFontSize(10)
      doc.setTextColor(colors.textLight)
      doc.setFont('helvetica', 'normal')
      const eventDate = project.event_date
        ? format(new Date(project.event_date), 'dd/MM/yyyy', { locale: ptBR })
        : 'A definir'
      doc.text(`Data: ${eventDate}`, 26, yPos + 16)

      doc.setFontSize(10)
      doc.setTextColor(colors.secondary)
      const totalValue = project.total_value || 0
      doc.text(`Total: ${formatCurrency(totalValue)}`, 150, yPos + 8)

      yPos += 25

      doc.setFontSize(9)
      doc.setTextColor(colors.text)
      doc.text(`Local: ${project.location || 'Não informado'}`, 20, yPos)

      yPos += 10

      const services = project.project_services || []
      if (services.length > 0) {
        const tableData = services.map((s) => [
          s.services?.name || s.name || 'Serviço Personalizado',
          String(s.quantity || 1),
          formatCurrency(s.unit_price || 0),
          formatCurrency(s.total_price || 0),
        ])

        let ty = yPos
        doc.setFillColor(colors.secondary)
        doc.rect(20, ty, 170, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text('Serviço / Item', 22, ty + 6)
        doc.text('Qtd', 100, ty + 6)
        doc.text('Val. Unit.', 120, ty + 6)
        doc.text('Total', 160, ty + 6)
        ty += 12

        doc.setTextColor(colors.text)
        doc.setFont('helvetica', 'normal')
        tableData.forEach((row) => {
          doc.text(String(row[0]), 22, ty)
          doc.text(String(row[1]), 100, ty)
          doc.text(String(row[2]), 120, ty)
          doc.text(String(row[3]), 160, ty)
          ty += 8
        })

        yPos = ty + 10
      } else {
        doc.setFontSize(9)
        doc.setTextColor(colors.textLight)
        doc.text('- Nenhum serviço detalhado -', 20, yPos)
        yPos += 15
      }

      if (index < projects.length - 1) {
        doc.setDrawColor(230, 230, 230)
        doc.line(20, yPos, 190, yPos)
        yPos += 15
      }
    })
  }

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.line(20, 280, 190, 280)
    doc.text(
      'KONTROL - Gestão Inteligente para Profissionais de Beleza',
      105,
      287,
      { align: 'center' },
    )
    doc.text(`Página ${i} de ${pageCount}`, 190, 287, { align: 'right' })
  }

  doc.save(`${client.full_name.replace(/\s+/g, '_')}_Ficha_Tecnica.pdf`)
}

export const exportFinancialExcel = async (
  data: FinancialExportItem[],
  fileName: string = 'Financeiro',
) => {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Dados')

  if (data.length > 0) {
    worksheet.columns = Object.keys(data[0]).map((key) => ({
      header: key,
      key: key,
      width: 20,
    }))
  }

  worksheet.addRows(data)

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

export interface MonthlyClosingEvent {
  total_value?: number | null
  assistant_commission?: number | null
  event_date?: string | null
  title?: string | null
  status?: string | null
  wedding_clients?: {
    name: string | null
  } | null
}

export const exportMonthlyClosing = async (events: MonthlyClosingEvent[]) => {
  const data = events.map((event) => {
    const total = Number(event.total_value) || 0
    const commission = Number(event.assistant_commission) || 0
    const netProfit = total - commission

    return {
      Data: event.event_date
        ? format(new Date(event.event_date), 'dd/MM/yyyy', { locale: ptBR })
        : 'N/A',
      Cliente: event.wedding_clients?.name || 'Cliente Removida',
      Evento: event.title || 'Sem título',
      'Valor Total': total,
      'Comíssão Equipe': commission,
      'Lucro Líquido': netProfit,
      Status: event.status || 'N/A',
    }
  })

  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Fechamento Mensal')

  worksheet.columns = [
    { header: 'Data', key: 'Data', width: 15 },
    { header: 'Cliente', key: 'Cliente', width: 30 },
    { header: 'Evento', key: 'Evento', width: 30 },
    { header: 'Valor Total', key: 'Valor Total', width: 15 },
    { header: 'Comíssão Equipe', key: 'Comíssão Equipe', width: 15 },
    { header: 'Lucro Líquido', key: 'Lucro Líquido', width: 15 },
    { header: 'Status', key: 'Status', width: 15 },
  ]

  worksheet.addRows(data)

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, `Kontrol_Fechamento_${format(new Date(), 'MM-yyyy')}.xlsx`)
}
