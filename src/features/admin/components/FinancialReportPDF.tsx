import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { MonthlyFinancialSummary } from '../hooks/useMonthlyFinancials'

Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
})

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', fontSize: 10, color: '#111' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    paddingBottom: 18,
    borderBottom: '1 solid #111',
  },
  brand: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  brandSub: { fontSize: 8, color: '#666', marginTop: 3, letterSpacing: 1 },
  docTitle: { fontSize: 18, fontWeight: 700 },
  docPeriod: {
    fontSize: 9,
    color: '#555',
    marginTop: 3,
    textAlign: 'right',
    letterSpacing: 1,
  },
  sectionLabel: {
    fontSize: 7,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 18,
  },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  kpiCell: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f5f5f5',
  },
  kpiLabel: {
    fontSize: 7,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  kpiValue: { fontSize: 16, fontWeight: 700 },
  kpiSmall: { fontSize: 9, color: '#555', marginTop: 2 },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottom: '1 solid #111',
    marginTop: 4,
  },
  th: {
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#666',
    fontWeight: 700,
  },
  tr: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottom: '1 solid #eee',
  },
  td: { fontSize: 10 },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #ddd',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#888', letterSpacing: 1 },
})

const currency = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n)

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

export function FinancialReportPDF({ data }: { data: MonthlyFinancialSummary }) {
  const generatedAt = shortDate(new Date().toISOString())

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>KHAOS_KONTROL</Text>
            <Text style={styles.brandSub}>Relatório financeiro · administração</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>RELATÓRIO MENSAL</Text>
            <Text style={styles.docPeriod}>{data.period.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Resumo</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabel}>Receita bruta</Text>
            <Text style={styles.kpiValue}>{currency(data.revenueGross)}</Text>
            <Text style={styles.kpiSmall}>
              {data.invoicesTotal} faturas emitidas
            </Text>
          </View>
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabel}>Receita líquida</Text>
            <Text style={styles.kpiValue}>{currency(data.revenueNet)}</Text>
            <Text style={styles.kpiSmall}>
              {data.invoicesPaid} faturas pagas
            </Text>
          </View>
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabel}>Pendente</Text>
            <Text style={styles.kpiValue}>
              {currency(data.revenueGross - data.revenueNet - data.refundsValue)}
            </Text>
            <Text style={styles.kpiSmall}>
              {data.invoicesPending} faturas em aberto
            </Text>
          </View>
        </View>

        {data.planBreakdown.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Assinaturas ativas por plano</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 3 }]}>Plano</Text>
              <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>
                Assinantes
              </Text>
              <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>MRR</Text>
            </View>
            {data.planBreakdown.map((p) => (
              <View key={p.plan} style={styles.tr}>
                <Text style={[styles.td, { flex: 3, textTransform: 'capitalize' }]}>
                  {p.plan}
                </Text>
                <Text style={[styles.td, { flex: 2, textAlign: 'right' }]}>
                  {p.subscribers}
                </Text>
                <Text style={[styles.td, { flex: 2, textAlign: 'right' }]}>
                  {currency(p.mrr)}
                </Text>
              </View>
            ))}
          </>
        )}

        {data.topUsers.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Top usuárias por receita</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 3 }]}>Usuária</Text>
              <Text style={[styles.th, { flex: 3 }]}>Email</Text>
              <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>Bruto</Text>
              <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>Pago</Text>
            </View>
            {data.topUsers.map((u) => (
              <View key={u.user_id} style={styles.tr}>
                <Text style={[styles.td, { flex: 3 }]}>
                  {u.full_name ?? '—'}
                </Text>
                <Text style={[styles.td, { flex: 3, fontSize: 9, color: '#555' }]}>
                  {u.email ?? '—'}
                </Text>
                <Text style={[styles.td, { flex: 2, textAlign: 'right' }]}>
                  {currency(u.revenue)}
                </Text>
                <Text style={[styles.td, { flex: 2, textAlign: 'right' }]}>
                  {currency(u.paid)}
                </Text>
              </View>
            ))}
          </>
        )}

        {data.refundsCount > 0 && (
          <>
            <Text style={styles.sectionLabel}>Reembolsos / Cancelamentos</Text>
            <View style={styles.tr}>
              <Text style={[styles.td, { flex: 3 }]}>
                {data.refundsCount} operação(ões)
              </Text>
              <Text style={[styles.td, { flex: 2, textAlign: 'right' }]}>
                {currency(data.refundsValue)}
              </Text>
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Gerado em {generatedAt} · Khaos Kontrol
          </Text>
          <Text style={styles.footerText}>{data.period}</Text>
        </View>
      </Page>
    </Document>
  )
}
