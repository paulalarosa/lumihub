import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ReportProject, FinancialExportItem } from '@/types/service-types'

interface Client {
  full_name: string
  phone: string | null
  email: string | null
  // Add other relevant fields
}

// Premium Bridal Report Generation
// Premium Bridal Report Generation
interface _AutoTableDoc extends jsPDF {
  lastAutoTable: { finalY: number }
}

export const generateClientPDF = (
  client: Client,
  projects: ReportProject[],
) => {
  const doc = new jsPDF()

  // -- CONFIGURATION & STYLES --
  const colors = {
    primary: '#D4AF37', // Gold
    secondary: '#000000', // Black
    text: '#333333',
    textLight: '#808080',
    bgLight: '#F9F9F9',
  }

  // -- HEADER --
  doc.setFillColor(colors.secondary)
  doc.rect(0, 0, 210, 50, 'F') // Dark Header Background

  // Logo / Brand Name
  doc.setTextColor(colors.primary)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('KONTROL', 20, 25)

  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text('EXCELLENCE IN BEAUTY MANAGEMENT // KHAOS STUDIO', 20, 32)

  // Report Title
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

  // -- CLIENT INFO SECTION --
  let yPos = 65

  // Avatar Placeholder (Optional logic could go here)

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
  doc.text(`Cadastrada em: ${format(new Date(), 'dd/MM/yyyy')}`, 20, yPos) // Using current date or specific if passed
  // doc.text(`Instagram: ${client.instagram || 'N/A'}`, 110, yPos);

  yPos += 20

  // -- PROJECTS & EVENTS --
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

      // Project Header
      doc.setFillColor(colors.primary)
      doc.rect(20, yPos, 2, 18, 'F') // Accent Bar

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

      // Financial Status Badge-ish
      doc.setFontSize(10)
      doc.setTextColor(colors.secondary)
      const totalValue = project.total_value || 0
      doc.text(
        `Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}`,
        150,
        yPos + 8,
      )

      yPos += 25

      // Details Grid
      doc.setFontSize(9)
      doc.setTextColor(colors.text)
      doc.text(`Local: ${project.location || 'Não informado'}`, 20, yPos)
      // doc.text(`Cerimonial: ${'N/A'}`, 110, yPos); // Add if available

      yPos += 10

      // SERVICES TABLE
      const services = project.project_services || []
      if (services.length > 0) {
        const tableData = services.map((s) => [
          // Handle dynamic structure: 'services' join or direct fields
          s.services?.name || s.name || 'Serviço Personalizado',
          s.quantity || 1,
          new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(s.unit_price || 0),
          new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(s.total_price || 0),
        ])

        autoTable(doc, {
          startY: yPos,
          head: [['Serviço / Item', 'Qtd', 'Val. Unit.', 'Total']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: {
            fillColor: colors.secondary,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 35, halign: 'right' },
            3: { cellWidth: 35, halign: 'right' },
          },
          margin: { left: 20, right: 20 },
        })

        interface AutoTableJsPDF extends jsPDF {
          lastAutoTable: { finalY: number }
        }

        // ... inside function
        yPos = (doc as unknown as AutoTableJsPDF).lastAutoTable.finalY + 15
      } else {
        doc.setFontSize(9)
        doc.setTextColor(colors.textLight)
        doc.text('- Nenhum serviço detalhado -', 20, yPos)
        yPos += 15
      }

      // Separator if not last
      if (index < projects.length - 1) {
        doc.setDrawColor(230, 230, 230)
        doc.line(20, yPos, 190, yPos)
        yPos += 15
      }
    })
  }

  // -- FOOTER --
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

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Fechamento Mensal')

  // Define columns with custom widths
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
