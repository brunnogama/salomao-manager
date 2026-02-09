import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Estilos do PDF - Padronização Manager (Navy & Gold)
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
    color: '#334155' // Slate 700 para corpo
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #0a192f',
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  logoText: {
    fontSize: 14,
    fontWeight: 'black',
    color: '#0a192f', // Navy principal
    letterSpacing: 2,
    textTransform: 'uppercase'
  },
  dateText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  title: {
    fontSize: 18,
    fontWeight: 'black',
    textAlign: 'center',
    marginVertical: 40,
    color: '#0a192f',
    textTransform: 'uppercase',
    letterSpacing: 3,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 10
  },
  section: {
    marginBottom: 20,
    textAlign: 'justify'
  },
  label: {
    fontWeight: 'black',
    fontSize: 9,
    color: '#b45309', // Gold/Amber para destaque de seção
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  value: {
    fontSize: 11,
    color: '#0f172a',
    marginBottom: 10,
    paddingLeft: 10,
    borderLeft: '2px solid #f1f5f9'
  },
  signatureContainer: {
    marginTop: 60,
    alignItems: 'center'
  },
  signatureLine: {
    width: 250,
    borderTop: '1px solid #0a192f',
    marginTop: 40,
    paddingTop: 8,
    textAlign: 'center'
  },
  signatureText: {
    fontSize: 10,
    fontWeight: 'black',
    color: '#0a192f',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTop: '1px solid #f1f5f9',
    paddingTop: 15,
    textTransform: 'uppercase',
    letterSpacing: 1
  }
});

interface ProposalData {
  clientName: string;
  object: string;
  value: string;
  date: string;
}

export const ProposalDocument = ({ data }: { data: ProposalData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.logoText}>SALOMÃO ADVOGADOS</Text>
        <Text style={styles.dateText}>{data.date}</Text>
      </View>

      {/* Título */}
      <Text style={styles.title}>Proposta de Honorários</Text>

      {/* Corpo */}
      <View style={styles.section}>
        <Text style={{ fontWeight: 'bold', color: '#0a192f' }}>
          Prezados Senhores,
        </Text>
        <Text style={{ marginTop: 15 }}>
          Apresentamos a presente proposta de prestação de serviços jurídicos para {data.clientName}, conforme detalhado nos itens subsequentes:
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>01. Objeto da Prestação de Serviços</Text>
        <Text style={styles.value}>{data.object}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>02. Investimento e Condições (Honorários)</Text>
        <Text style={styles.value}>{data.value}</Text>
      </View>

      <View style={{ marginTop: 40 }}>
        <Text>
          Colocamo-nos à inteira disposição para quaisquer esclarecimentos ou ajustes que se façam necessários.
        </Text>
        <Text style={{ marginTop: 25, fontWeight: 'bold' }}>Atenciosamente,</Text>
        
        <View style={styles.signatureContainer}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureText}>Salomão Sociedade de Advogados</Text>
          </View>
        </View>
      </View>

      {/* Rodapé */}
      <Text style={styles.footer}>
        Rio de Janeiro | São Paulo | Santa Catarina | Brasília | Espírito Santo
      </Text>
    </Page>
  </Document>
);