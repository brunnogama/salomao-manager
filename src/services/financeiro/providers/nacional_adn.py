import json
import uuid
from lxml import etree as ET
from datetime import datetime

class NacionalAdnProvider:
    def __init__(self, inscricao_municipal, cnpj_prestador):
        self.inscricao_municipal = inscricao_municipal
        self.cnpj_prestador = cnpj_prestador

    def preparar_dps(self, dados):
        """
        Prepara o XML da Declaração de Prestação de Serviço (DPS)
        no novo Padrão Nacional da Receita Federal (ADN).
        """
        # Criando o elemento raiz da DPS
        root = ET.Element('DPS', xmlns="http://www.sped.fazenda.gov.br/nfse", id=f"DPS_{uuid.uuid4().hex}")
        
        inf_dps = ET.SubElement(root, 'InfDPS', Id="INF1")
        
        # 1. Ambiente (1 - Produção, 2 - Homologação)
        amb = ET.SubElement(inf_dps, 'tpAmb')
        amb.text = "1"
        
        # 2. Data de Emissão
        dh_emi = ET.SubElement(inf_dps, 'dhEmi')
        dh_emi.text = datetime.now().strftime("%Y-%m-%dT%H:%M:%S-03:00")
        
        # 3. Dados do Prestador
        prest = ET.SubElement(inf_dps, 'prest')
        cnpj_p = ET.SubElement(prest, 'CNPJ')
        cnpj_p.text = self.cnpj_prestador.replace('.', '').replace('/', '').replace('-', '')
        im_p = ET.SubElement(prest, 'IM')
        im_p.text = self.inscricao_municipal
        
        # Parse servico
        servico_str = dados.get('servico', '{}')
        if isinstance(servico_str, str):
            try:
                servico = json.loads(servico_str)
            except:
                servico = {}
        else:
            servico = servico_str
            
        optante_simples = servico.get('optante_simples', '2') # 1=Sim, 2=Não
        
        # Tributação / Regime
        trib = ET.SubElement(prest, 'optSN')
        trib.text = '1' if optante_simples == '1' else '2'
        
        # 4. Dados do Tomador
        tomador_str = dados.get('tomador', '{}')
        if isinstance(tomador_str, str):
            try:
                tomador = json.loads(tomador_str)
            except:
                tomador = {}
        else:
            tomador = tomador_str
            
        toma = ET.SubElement(inf_dps, 'toma')
        cnpj_t = ET.SubElement(toma, 'CNPJ')
        cnpj_t.text = tomador.get('cnpj', '').replace('.', '').replace('/', '').replace('-', '')
        
        # 5. Serviço Prestado e Impostos
        serv = ET.SubElement(inf_dps, 'serv')
        
        loc_prest = ET.SubElement(serv, 'locPrest')
        loc_prest.text = "BR" # Padrão
        
        c_trib = ET.SubElement(serv, 'cTribNac')
        c_trib.text = servico.get('codigo_tributacao', '171401')
        
        c_nbs = ET.SubElement(serv, 'cNBS')
        c_nbs.text = servico.get('codigo_nbs', '113019000')
        
        desc = ET.SubElement(serv, 'xDesc')
        desc.text = servico.get('discriminacao', 'Honorários Advocatícios')
        
        # Valores
        valores = ET.SubElement(serv, 'valores')
        v_serv = ET.SubElement(valores, 'vServ')
        v_serv.text = str(servico.get('valor', 0))
        
        # Retenções
        iss_retido = servico.get('iss_retido', '2')
        retencoes = ET.SubElement(valores, 'trib')
        v_iss = ET.SubElement(retencoes, 'ISSQN')
        tp_ret = ET.SubElement(v_iss, 'tpRet')
        tp_ret.text = '1' if iss_retido == '1' else '2' # 1 = Retido, 2 = Não Retido
        
        return root
