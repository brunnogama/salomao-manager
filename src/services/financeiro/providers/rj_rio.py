from lxml import etree as ET

class RioJaneiroProvider:
    def __init__(self, inscricao_municipal, cnpj_prestador):
        self.inscricao_municipal = inscricao_municipal
        self.cnpj_prestador = cnpj_prestador

    def preparar_rps(self, dados):
        """
        Prepara o XML do RPS para o Rio de Janeiro.
        Este é um exemplo básico e deve ser ajustado com 
        os campos exatos requeridos pelo web service da prefeitura.
        """
        # Criando o elemento raiz e adicionando o namespace
        root = ET.Element('EnviarLoteRpsEnvio', xmlns="http://www.abrasf.org.br/nfse.xsd")
        
        lote_rps = ET.SubElement(root, 'LoteRps', id="LOTE1", versao="1.00")
        
        numero_lote = ET.SubElement(lote_rps, 'NumeroLote')
        numero_lote.text = "1"
        
        cnpj = ET.SubElement(lote_rps, 'Cnpj')
        cnpj.text = self.cnpj_prestador
        
        inscricao = ET.SubElement(lote_rps, 'InscricaoMunicipal')
        inscricao.text = self.inscricao_municipal
        
        quantidade = ET.SubElement(lote_rps, 'QuantidadeRps')
        quantidade.text = "1"
        
        lista_rps = ET.SubElement(lote_rps, 'ListaRps')
        rps = ET.SubElement(lista_rps, 'Rps')
        
        inf_rps = ET.SubElement(rps, 'InfRps', id="RPS1")
        
        identificacao = ET.SubElement(inf_rps, 'IdentificacaoRps')
        numero_rps = ET.SubElement(identificacao, 'Numero')
        numero_rps.text = "1"
        serie = ET.SubElement(identificacao, 'Serie')
        serie.text = "1"
        tipo = ET.SubElement(identificacao, 'Tipo')
        tipo.text = "1"
        
        data_emissao = ET.SubElement(inf_rps, 'DataEmissao')
        data_emissao.text = dados.get('dataEmissao', '')
        
        natureza = ET.SubElement(inf_rps, 'NaturezaOperacao')
        natureza.text = "1"
        
        optante = ET.SubElement(inf_rps, 'OptanteSimplesNacional')
        optante.text = "2" # 2 = Não
        
        incentivador = ET.SubElement(inf_rps, 'IncentivadorCultural')
        incentivador.text = "2" # 2 = Não
        
        status = ET.SubElement(inf_rps, 'Status')
        status.text = "1" # 1 = Normal
        
        # O signxml precisa de um ElementTree (lxml) ou string
        # O utils.signer.py usa lxml no background ou string, 
        # mas ET do Python funciona se for convertido pra string.
        # Vamos retornar o Element direto que será consumido no signature_server.
        return root
