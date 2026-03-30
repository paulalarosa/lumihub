import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { formatDate, DATE_FORMATS } from '@/lib/date-utils'
// ptBR removed as it is handled by date-utils

// Registrar fontes (opcional - deixa mais profissional)
Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 11,
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  clause: {
    marginBottom: 12,
    textAlign: 'justify',
  },
  clauseNumber: {
    fontWeight: 'bold',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 10,
    marginBottom: 10,
    border: '1 solid #ddd',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCol: {
    padding: 8,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: '1 solid #000',
    paddingTop: 20,
  },
  signature: {
    marginTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlock: {
    width: '45%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '1 solid #000',
    marginBottom: 5,
    paddingTop: 5,
  },
})

export interface ContractData {
  contractNumber: string
  makeupArtist: {
    name: string
    cpf: string
    address: string
    phone: string
    email: string
  }
  client: {
    name: string
    cpf: string
    address: string
    phone: string
    email: string
  }
  event: {
    date: Date
    time: string
    location: string
    type: string
  }
  services: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  payment: {
    total: number
    deposit: number
    remaining: number
    paymentMethod: string
    dueDate: Date
  }
}

export const ContractTemplate = ({ data }: { data: ContractData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MAQUIAGEM
        </Text>
        <Text style={styles.subtitle}>Contrato Nº {data.contractNumber}</Text>
      </View>

      {/* Partes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Das Partes</Text>

        <View style={styles.clause}>
          <Text>
            <Text style={styles.clauseNumber}>CONTRATADA: </Text>
            {data.makeupArtist.name}, inscrita no CPF sob nº{' '}
            {data.makeupArtist.cpf}, residente e domiciliada em{' '}
            {data.makeupArtist.address}, telefone {data.makeupArtist.phone},
            email {data.makeupArtist.email}.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text>
            <Text style={styles.clauseNumber}>CONTRATANTE: </Text>
            {data.client.name}, inscrita no CPF sob nº {data.client.cpf},
            residente e domiciliada em {data.client.address}, telefone{' '}
            {data.client.phone}, email {data.client.email}.
          </Text>
        </View>
      </View>

      {/* Objeto */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Do Objeto</Text>
        <View style={styles.clause}>
          <Text>
            2.1. O presente contrato tem como objeto a prestação de serviços de
            maquiagem profissional para o evento {data.event.type}, a
            realizar-se no dia {formatDate(data.event.date, DATE_FORMATS.FULL)},
            às {data.event.time}, no local: {data.event.location}.
          </Text>
        </View>
      </View>

      {/* Serviços */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Dos Serviços Contratados</Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCol}>Descrição</Text>
            <Text style={[styles.tableCol, { flex: 0.3 }]}>Qtd</Text>
            <Text style={[styles.tableCol, { flex: 0.4 }]}>Valor Unit.</Text>
            <Text style={[styles.tableCol, { flex: 0.4 }]}>Total</Text>
          </View>

          {data.services.map((service, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.tableCol}>{service.description}</Text>
              <Text style={[styles.tableCol, { flex: 0.3 }]}>
                {service.quantity}
              </Text>
              <Text style={[styles.tableCol, { flex: 0.4 }]}>
                R$ {service.unitPrice.toFixed(2)}
              </Text>
              <Text style={[styles.tableCol, { flex: 0.4 }]}>
                R$ {service.total.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Pagamento */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          4. Do Valor e Forma de Pagamento
        </Text>

        <View style={styles.clause}>
          <Text>
            4.1. O valor total dos serviços é de R${' '}
            {data.payment.total.toFixed(2)}({extenso(data.payment.total)}).
          </Text>
        </View>

        <View style={styles.clause}>
          <Text>4.2. O pagamento será realizado da seguinte forma:</Text>
          <Text style={{ marginLeft: 20, marginTop: 5 }}>
            • Sinal: R$ {data.payment.deposit.toFixed(2)} (pago na assinatura do
            contrato)
          </Text>
          <Text style={{ marginLeft: 20 }}>
            • Saldo: R$ {data.payment.remaining.toFixed(2)} (até{' '}
            {formatDate(data.payment.dueDate, DATE_FORMATS.SHORT)})
          </Text>
          <Text style={{ marginLeft: 20 }}>
            • Forma: {data.payment.paymentMethod}
          </Text>
        </View>
      </View>

      {/* Cláusulas Padrão */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Das Obrigações da Contratada</Text>
        <Text style={styles.clause}>
          5.1. A CONTRATADA se compromete a realizar os serviços com qualidade e
          profissionalismo.
        </Text>
        <Text style={styles.clause}>
          5.2. A CONTRATADA utilizará produtos profissionais de qualidade.
        </Text>
        <Text style={styles.clause}>
          5.3. A CONTRATADA chegará ao local com 30 minutos de antecedência.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          6. Das Obrigações da Contratante
        </Text>
        <Text style={styles.clause}>
          6.1. A CONTRATANTE fornecerá local adequado para execução dos
          serviços.
        </Text>
        <Text style={styles.clause}>
          6.2. A CONTRATANTE informará alergias ou restrições de produtos.
        </Text>
        <Text style={styles.clause}>
          6.3. A CONTRATANTE efetuará o pagamento nas datas acordadas.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Do Cancelamento</Text>
        <Text style={styles.clause}>
          7.1. Em caso de cancelamento com mais de 30 dias de antecedência, será
          devolvido 100% do sinal pago.
        </Text>
        <Text style={styles.clause}>
          7.2. Cancelamento entre 15 e 30 dias: devolução de 50% do sinal.
        </Text>
        <Text style={styles.clause}>
          7.3. Cancelamento com menos de 15 dias: sem devolução do sinal.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={{ textAlign: 'center', marginBottom: 15, fontSize: 10 }}>
          E, por estarem assim justas e contratadas, assinam o presente
          instrumento em duas vias de igual teor e forma.
        </Text>

        <Text style={{ textAlign: 'center', marginBottom: 30, fontSize: 10 }}>
          {formatDate(new Date(), DATE_FORMATS.FULL)}
        </Text>

        <View style={styles.signature}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>
              _______________________________
            </Text>
            <Text style={{ fontSize: 9 }}>{data.makeupArtist.name}</Text>
            <Text style={{ fontSize: 9, color: '#666' }}>CONTRATADA</Text>
          </View>

          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>
              _______________________________
            </Text>
            <Text style={{ fontSize: 9 }}>{data.client.name}</Text>
            <Text style={{ fontSize: 9, color: '#666' }}>CONTRATANTE</Text>
          </View>
        </View>

        <Text
          style={{
            textAlign: 'center',
            fontSize: 8,
            color: '#888',
            marginTop: 30,
          }}
        >
          Este contrato possui validade jurídica conforme MP 2.200-2/2001.
          Aceite registrado eletronicamente via logs de sistema Khaos Kontrol sob o
          ID: {data.contractNumber}.
        </Text>
      </View>
    </Page>
  </Document>
)

// Helper function (implementar ou usar biblioteca)
function extenso(valor: number): string {
  // Implementação simplificada - use biblioteca como 'numero-por-extenso' em produção
  return `${Math.floor(valor)} reais`
}
