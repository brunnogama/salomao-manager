import json
import uuid
import random
from lxml import etree as ET
from datetime import datetime, timezone, timedelta

class NacionalAdnProvider:
    def __init__(self, inscricao_municipal, cnpj_prestador):
        self.inscricao_municipal = inscricao_municipal
        self.cnpj_prestador = cnpj_prestador

    def preparar_dps(self, dados):
        """
        Prepara o XML da Declaração de Prestação de Serviço (DPS)
        sem prefixos indesejados (ns0:), usando parse nativo de raw string.
        """
        cnpj_prestador_limpo = self.cnpj_prestador.replace('.', '').replace('/', '').replace('-', '')
        if not cnpj_prestador_limpo:
            cnpj_prestador_limpo = '14493710000105'
        cnpj_prestador_limpo = cnpj_prestador_limpo.zfill(14)
            
        # A Sefin Nacional exige (E0004) "DPS" seguido de exatos 42 números matematicamente arranjados
        # Formato: cLocEmi(7) + tpInscFed(1) + cpfCnpj(14) + serie(5) + nMDF(15)
        c_loc_emi = '3304557'
        tp_insc_fed = '2' # 2 = CNPJ
        serie_dps = '1'
        n_dps = str(random.randint(1000, 99999))
        
        dps_numerico = f"{c_loc_emi}{tp_insc_fed}{cnpj_prestador_limpo}{serie_dps.zfill(5)}{n_dps.zfill(15)}"
        dps_id = f"DPS{dps_numerico}"
        
        # Datas e Formatações (Fuso Horário BR -03:00 para evitar erro de emissão no futuro no servidor AWS/Render em UTC)
        fuso_br = timezone(timedelta(hours=-3))
        agora_br = datetime.now(fuso_br)
        
        dh_emi = agora_br.strftime("%Y-%m-%dT%H:%M:%S-03:00")
        d_compet = agora_br.strftime("%Y-%m-%d")
        if not cnpj_prestador_limpo:
            cnpj_prestador_limpo = '14493710000105'
            
        im_prestador = str(self.inscricao_municipal).replace('.', '').replace('-', '').strip()
        if not im_prestador:
            im_prestador = '05286735'
        
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
        
        # Parse servico
        servico_str = dados.get('servico', '{}')
        servico = json.loads(servico_str) if isinstance(servico_str, str) else servico_str
        
        # Sefin Nacional ADN schema values: 1 = Não Optante / 2 = MEI / 3 = Optante ME/EPP
        opt_sn_val = str(servico.get('optante_simples', 'False')).lower()
        is_simples = opt_sn_val in ['true', '1', 'sim', 'yes']
        optante_simples = '3' if is_simples else '1'
        
        # Tags de Regime Tributário Obrigatórias
        if is_simples:
            reg_trib_xml = f"""<regTrib>
                <opSimpNac>{optante_simples}</opSimpNac>
                <regApTribSN>1</regApTribSN>
                <regEspTrib>6</regEspTrib>
            </regTrib>"""
        else:
            # Não optantes (1) não devem conter a tag regApTribSN no grupo
            reg_trib_xml = f"""<regTrib>
                <opSimpNac>{optante_simples}</opSimpNac>
                <regEspTrib>6</regEspTrib>
            </regTrib>"""
        
        # Dados do Servico
        # A Lei Complementar 116/03 define Advocacia como item 17.14 (sem subitens).
        # A tabela Nacional Sefin MAPEIA itens sem subitem com o final '00' (ex: 171400).
        # Códigos como 171401 geram erro E0312 de não administrado pelo município!
        c_trib_raw = servico.get('codigo_tributacao', '171400').replace('.', '').replace('-', '')
        if not c_trib_raw or c_trib_raw in ['171401', '1714']:
            c_trib_nac = '171400'
        else:
            c_trib_nac = c_trib_raw.zfill(6)
            
        c_nbs = servico.get('codigo_nbs', '113019000').replace('.', '').replace('-', '')
        desc = servico.get('discriminacao', 'Honorários Advocatícios')
        v_serv = str(servico.get('valor', '0'))
        
        iss_retido = '2' if str(servico.get('iss_retido', False)).lower() == 'true' else '1'
        
        # Template XML Raw (Garante zero namespaces espúrios como ns0:)
        xml_template = f"""<DPS xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">
    <infDPS Id="{dps_id}">
        <tpAmb>1</tpAmb>
        <dhEmi>{dh_emi}</dhEmi>
        <verAplic>SalomaoManager_1.0</verAplic>
        <serie>{serie_dps}</serie>
        <nDPS>{n_dps}</nDPS>
        <dCompet>{d_compet}</dCompet>
        <tpEmit>1</tpEmit>
        <cLocEmi>{c_loc_emi}</cLocEmi>
        <prest>
            <CNPJ>{cnpj_prestador_limpo}</CNPJ>
            {reg_trib_xml}
        </prest>
        {toma_xml}
        <serv>
            <locPrest>
                <cLocPrestacao>3304557</cLocPrestacao>
            </locPrest>
            <cServ>
                <cTribNac>{c_trib_nac}</cTribNac>
                <xDescServ>{desc}</xDescServ>
                <cNBS>{c_nbs}</cNBS>
            </cServ>
        </serv>
        <valores>
            <vServPrest>
                <vServ>{v_serv}</vServ>
            </vServPrest>
            <trib>
                <tribMun>
                    <tribISSQN>1</tribISSQN>
                    <tpRetISSQN>{iss_retido}</tpRetISSQN>
                </tribMun>
                <totTrib>
                    <vTotTrib>
                        <vTotTribFed>0.00</vTotTribFed>
                        <vTotTribEst>0.00</vTotTribEst>
                        <vTotTribMun>0.00</vTotTribMun>
                    </vTotTrib>
                </totTrib>
            </trib>
            </valores>
    </infDPS>
</DPS>"""
        
        # Parsing limpo para ElementTree mantendo o namespace raiz intacto
        parser = ET.XMLParser(remove_blank_text=True)
        root = ET.fromstring(xml_template.encode('utf-8'), parser)
        return root
