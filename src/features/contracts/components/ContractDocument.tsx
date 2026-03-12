import React from 'react'
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer'

// Register standard fonts
// Note: In a real production environment, you might want to register a specific font file
// to ensure perfect consistency. For now, we use Helvetica which is standard in PDF.

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 10,
    alignItems: 'baseline',
  },
  businessName: {
    fontSize: 18,
    fontFamily: 'Times-Roman',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  contractId: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 15,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  text: {
    marginBottom: 10,
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 9,
    fontFamily: 'Courier',
    color: '#666666',
  },
  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 40,
  },
  signatureBlock: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 5,
  },
  signatureText: {
    fontSize: 10,
    marginTop: 2,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginVertical: 10,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableCol: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    fontSize: 10,
    padding: 5,
  },
})

import { Contract } from '../types'

interface ContractDocumentProps {
  contract: Contract
  businessName?: string
}

const DEFAULT_TERMS = `
1. SERVICE AGREEMENT
The Service Provider agrees to provide makeup and beauty services as detailed in this agreement. The Client agrees to pay the total fee specified for these services.

2. PAYMENT TERMS
A non-refundable deposit is required to secure the booking. The remaining balance is due on the day of services.

3. CANCELLATION POLICY
Cancellations made less than 48 hours before the event date may be subject to a cancellation fee.

4. LIABILITY
The Client agrees to disclose any allergies or skin conditions. The Service Provider is not liable for allergic reactions if not disclosed.

5. MEDIA RELEASE
The Client grants permission for the Service Provider to use photographs for portfolio and marketing purposes, unless otherwise specified in writing.
`

export const ContractDocument = ({
  contract,
  businessName = 'KHAOS STUDIO',
}: ContractDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.businessName}>{businessName}</Text>
        <Text style={styles.contractId}>
          REF: #{contract.id.slice(0, 8).toUpperCase()}
        </Text>
      </View>

      {/* Title */}
      <Text
        style={{
          fontSize: 14,
          fontFamily: 'Helvetica-Bold',
          textAlign: 'center',
          marginBottom: 20,
        }}
      >
        SERVICE AGREEMENT
      </Text>

      {/* Contract Details */}
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.text}>
          This Agreement is entered into on this day of{' '}
          {new Date().toLocaleDateString('pt-BR')}, by and between:
        </Text>
        <Text style={styles.text}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>PROVIDER:</Text>{' '}
          {businessName}
        </Text>
        <Text style={styles.text}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>CLIENT:</Text>{' '}
          {contract.clients?.name || 'Client'}
        </Text>
        <Text style={styles.text}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>DATE:</Text>{' '}
          {contract.created_at
            ? new Date(contract.created_at).toLocaleDateString('pt-BR')
            : '-'}
        </Text>
      </View>

      {/* Services Table */}
      <Text style={styles.sectionTitle}>TERMS & CONDITIONS</Text>
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.text}>
          Value:{' '}
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(0)}{' '}
          {/* Simplified for now as Contract doesn't have totalValue yet */}
        </Text>
      </View>

      {/* Clauses */}
      <Text style={styles.sectionTitle}>CLAUSES</Text>
      <Text style={styles.text}>{contract.content || DEFAULT_TERMS}</Text>

      {/* Signatures */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureText}>{businessName}</Text>
          <Text style={{ fontSize: 8, color: '#666' }}>Service Provider</Text>
        </View>
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureText}>
            {contract.clients?.name || 'Client'}
          </Text>
          <Text style={{ fontSize: 8, color: '#666' }}>Client</Text>
        </View>
      </View>

      {/* Footer */}
      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  </Document>
)
