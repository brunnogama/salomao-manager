import json
import uuid
import random
from lxml import etree as ET
from datetime import datetime

class NacionalAdnProvider:
    def __init__(self, inscricao_municipal, cnpj_prestador):
        self.inscricao_municipal = inscricao_municipal
        self.cnpj_prestador = cnpj_prestador

    def preparar_dps(self, dados):
        """
        Prepara o XML da Declaração de Prestação de Serviço (DPS)
        sem prefixos indesejados (ns0:), usando parse nativo de raw string.
        """
        # A Sefin Nacional exige obrigatoriamente "DPS" seguido de 42 números inteiros
        dps_numerico = ''.join([str(random.randint(0, 9)) for _ in range(42)])
        dps_id = f"DPS{dps_numerico}"
        
        # Datas e Formatações
        dh_emi = datetime.now().strftime("%Y-%m-%dT%H:%M:%S-03:00")
        d_compet = datetime.now().strftime("%Y-%m-%d")
        cnpj_prestador_limpo = self.cnpj_prestador.replace('.', '').replace('/', '').replace('-', '')
        if not cnpj_prestador_limpo:
            cnpj_prestador_limpo = '14493710000105'
        
        # Parse servico
        servico_str = dados.get('servico', '{}')
        servico = json.loads(servico_str) if isinstance(servico_str, str) else servico_str
        optante_simples = '1' if str(servico.get('optante_simples', '2')) == '1' else '2'
        
        # Parse tomador
        tomador_str = dados.get('tomador', '{}')
        tomador = json.loads(tomador_str) if isinstance(tomador_str, str) else tomador_str
        
        cnpj_tomador_limpo = tomador.get('cnpj', '').replace('.', '').replace('/', '').replace('-', '')
        cpf_tomador_limpo = tomador.get('cpf', '').replace('.', '').replace('-', '')
        
        # Muitos frontends enviam CPF no campo cnpj dependendo da entidade. Validamos pelo tamanho!
        doc_unificado = cnpj_tomador_limpo or cpf_tomador_limpo
        
        if doc_unificado:
            if len(doc_unificado) == 11:
                doc_tomador = f"<CPF>{doc_unificado}</CPF>"
            else:
                doc_tomador = f"<CNPJ>{doc_unificado}</CNPJ>"
        else:
            doc_tomador = ""
            
        nome_tomador = tomador.get('nome', 'Cliente Não Identificado').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')[:150]
            
        toma_xml = f"""<toma>
            {doc_tomador}
            <xNome>{nome_tomador}</xNome>
        </toma>""" if doc_tomador else ""
        
        # Tags de Regime Tributário Obrigatórias
        reg_trib_xml = f"""<regTrib>
                <opSimpNac>{optante_simples}</opSimpNac>
                <regApTribSN>1</regApTribSN>
                <regEspTrib>6</regEspTrib>
            </regTrib>"""
        
        # Dados do Servico
        c_trib = servico.get('codigo_tributacao', '171401')
        c_nbs = servico.get('codigo_nbs', '113019000')
        desc = servico.get('discriminacao', 'Honorários Advocatícios')
        v_serv = str(servico.get('valor', '0'))
        
        iss_retido = '1' if str(servico.get('iss_retido', '2')) == '1' else '2'
        
        # Template XML Raw (Garante zero namespaces espúrios como ns0:)
        xml_template = f"""<DPS xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">
    <infDPS Id="{dps_id}">
        <tpAmb>1</tpAmb>
        <dhEmi>{dh_emi}</dhEmi>
        <verAplic>SalomaoManager_1.0</verAplic>
        <serie>1</serie>
        <nDPS>{random.randint(1000, 99999)}</nDPS>
        <dCompet>{d_compet}</dCompet>
        <tpEmit>1</tpEmit>
        <cLocEmi>3304557</cLocEmi>
        <prest>
            <CNPJ>{cnpj_prestador_limpo}</CNPJ>
            <IM>{self.inscricao_municipal}</IM>
            {reg_trib_xml}
        </prest>
        {toma_xml}
        <serv>
            <locPrest>
                <cLocPrestacao>3304557</cLocPrestacao>
            </locPrest>
            <cServ>
                <cTribNac>{c_trib}</cTribNac>
                <cNBS>{c_nbs}</cNBS>
                <xDescServ>{desc}</xDescServ>
            </cServ>
            <valores>
                <vServ>{v_serv}</vServ>
                <trib>
                    <ISSQN>
                        <tpRet>{iss_retido}</tpRet>
                    </ISSQN>
                </trib>
            </valores>
        </serv>
    </infDPS>
</DPS>"""
        
        # Parsing limpo para ElementTree mantendo o namespace raiz intacto
        parser = ET.XMLParser(remove_blank_text=True)
        root = ET.fromstring(xml_template.encode('utf-8'), parser)
        return root
