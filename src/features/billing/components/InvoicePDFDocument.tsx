import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
})

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Roboto', fontSize: 10, color: '#111' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 20,
    borderBottom: '1 solid #111',
  },
  brand: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  brandSub: { fontSize: 8, color: '#666', marginTop: 4, letterSpacing: 1 },
  docTitle: { fontSize: 20, fontWeight: 700, letterSpacing: 1 },
  docNumber: {
    fontSize: 9,
    color: '#555',
    marginTop: 4,
    textAlign: 'right',
    letterSpacing: 1.5,
  },
  gridRow: { flexDirection: 'row', gap: 20, marginBottom: 28 },
  col: { flex: 1 },
  label: {
    fontSize: 7,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  value: { fontSize: 10, color: '#111', marginBottom: 2 },
  muted: { fontSize: 9, color: '#555' },
  amountSection: {
    backgroundColor: '#f5f5f5',
    padding: 24,
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 8,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 6,
  },
  amountValue: { fontSize: 26, fontWeight: 700, letterSpacing: 0.5 },
  amountCurrency: { fontSize: 12, color: '#555', marginTop: 4 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1 solid #ddd',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottom: '1 solid #111',
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottom: '1 solid #eee',
  },
  tableCell: { fontSize: 10 },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    borderTop: '1 solid #ddd',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#888', letterSpacing: 1 },
})

export interface InvoicePDFData {
  invoice: {
    number: string
    amount: number
    status: string
    createdAt: string
    dueDate: string | null
    paidAt: string | null
  }
  issuer: {
    businessName: string
    cpf: string | null
    email: string | null
    phone: string | null
    address: string | null
  }
  client: {
    name: string | null
    email: string | null
    phone: string | null
    cpf: string | null
  } | null
  project: {
    name: string | null
    eventDate: string | null
  } | null
}

const currency = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

const formatDate = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const statusLabel = (status: string) => {
  const normalized = status.toLowerCase()
  if (normalized === 'paid' || normalized === 'succeeded') return 'PAGO'
  if (normalized === 'pending' || normalized === 'open') return 'PENDENTE'
  if (normalized === 'failed' || normalized === 'past_due') return 'ATRASADO'
  if (normalized === 'cancelled') return 'CANCELADA'
  return status.toUpperCase()
}

export function InvoicePDFDocument({ invoice, issuer, client, project }: InvoicePDFData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>KHAOS_KONTROL</Text>
            <Text style={styles.brandSub}>Fatura digital</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>FATURA</Text>
            <Text style={styles.docNumber}>№ {invoice.number}</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.col}>
            <Text style={styles.label}>EMITENTE</Text>
            <Text style={styles.value}>{issuer.businessName}</Text>
            {issuer.cpf && <Text style={styles.muted}>CPF/CNPJ: {issuer.cpf}</Text>}
            {issuer.email && <Text style={styles.muted}>{issuer.email}</Text>}
            {issuer.phone && <Text style={styles.muted}>{issuer.phone}</Text>}
            {issuer.address && <Text style={styles.muted}>{issuer.address}</Text>}
          </View>
          {client && (
            <View style={styles.col}>
              <Text style={styles.label}>CLIENTE</Text>
              <Text style={styles.value}>{client.name ?? '—'}</Text>
              {client.cpf && <Text style={styles.muted}>CPF: {client.cpf}</Text>}
              {client.email && <Text style={styles.muted}>{client.email}</Text>}
              {client.phone && <Text style={styles.muted}>{client.phone}</Text>}
            </View>
          )}
        </View>

        {project && (project.name || project.eventDate) && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.label}>SERVIÇO</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Descrição</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>
                Data do evento
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>
                Valor
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>
                {project.name ?? 'Serviço de maquiagem'}
              </Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>
                {formatDate(project.eventDate)}
              </Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>
                {currency(invoice.amount)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>{currency(invoice.amount)}</Text>
          <Text style={styles.amountCurrency}>Real brasileiro (BRL)</Text>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.label}>EMISSÃO</Text>
              <Text style={styles.value}>{formatDate(invoice.createdAt)}</Text>
            </View>
            <View>
              <Text style={styles.label}>VENCIMENTO</Text>
              <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
            </View>
            <View>
              <Text style={styles.label}>STATUS</Text>
              <Text style={styles.value}>{statusLabel(invoice.status)}</Text>
            </View>
          </View>
          {invoice.paidAt && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.muted}>Pago em {formatDate(invoice.paidAt)}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Gerado por Khaos Kontrol · khaoskontrol.com.br
          </Text>
          <Text style={styles.footerText}>№ {invoice.number}</Text>
        </View>
      </Page>
    </Document>
  )
}
