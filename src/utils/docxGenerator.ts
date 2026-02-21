import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, Header, Footer, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';
import { Contract } from '../types/controladoria';
import { moedaPorExtenso, percentualPorExtenso } from './extenso';

interface ProposalData extends Contract {
    partners_data?: {
        name: string;
        civil_status: string;
        nacionalidade: string;
        oab_numero: string;
        oab_uf: string;
        cpf: string;
        gender: string;
    }[];
    location?: string;
}

// Helper to fetch image as ArrayBuffer
const fetchImage = async (url: string): Promise<ArrayBuffer> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blob.arrayBuffer();
};

const formatCurrency = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === "") return "[incluir valor]";
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) : value;
    if (isNaN(num)) return "[incluir valor]";
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPercent = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === "") return "[incluir %]";
    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.').replace('%', '')) : value;
    if (isNaN(num)) return "[incluir %]";
    return `${num.toLocaleString('pt-BR')}%`;
};

const getExtensoText = (value: number | string | undefined, isPercent: boolean = false): string => {
    if (value === undefined || value === null || value === "") return "";
    try {
        const num = typeof value === 'string' ? parseFloat(value.toString().replace(/[^\d,.-]/g, '').replace(',', '.')) : value;
        if (isNaN(num)) return "";
        return ` (${isPercent ? percentualPorExtenso(num) : moedaPorExtenso(num)})`;
    } catch (e) {
        return "";
    }
};

export const generateProposalDocx = async (data: ProposalData, proposalCode: string) => {
    const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const location = data.location || "Rio de Janeiro";
    const dateLine = `${location}, ${today}`;

    // Fetch images
    const logoBuffer = await fetchImage('/logo-salomao.png');
    const footer1Buffer = await fetchImage('/rodape1.png');
    const footer2Buffer = await fetchImage('/rodape2.png');

    const standardFont = "Arial";
    const boldFont = "Arial";

    const createTextParagraph = (text: string, options: { bold?: boolean, size?: number, color?: string, alignment?: any, spacing?: number } = {}) => {
        return new Paragraph({
            alignment: options.alignment || AlignmentType.JUSTIFIED,
            spacing: { line: 288, after: options.spacing !== undefined ? options.spacing : 200 },
            children: [
                new TextRun({
                    text,
                    font: options.bold ? boldFont : standardFont,
                    size: options.size || 22,
                    bold: options.bold || false,
                    color: options.color || "000000"
                }),
            ]
        });
    };

    const partners = data.partners_data || [{
        name: data.partner_name || "[incluir nome do sócio]",
        civil_status: "casado",
        nacionalidade: "brasileiro",
        oab_numero: "XXXXXX",
        oab_uf: "RJ",
        cpf: "XXX.XXX.XXX-XX",
        gender: "M"
    }];

    // --- SECTIONS ---

    // Header & Footer
    const header = new Header({
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new ImageRun({
                        data: logoBuffer,
                        transformation: { width: 180, height: 45 },
                    } as any),
                ],
            }),
            new Paragraph({ text: "", spacing: { line: 288, after: 200 } }), // Space between logo and date
        ],
    });

    const footer = new Footer({
        children: [
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.LEFT,
                                        children: [
                                            new ImageRun({
                                                data: footer1Buffer,
                                                transformation: { width: 350, height: 35 },
                                            } as any),
                                        ]
                                    })
                                ],
                                width: { size: 70, type: WidthType.PERCENTAGE },
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new ImageRun({
                                                data: footer2Buffer,
                                                transformation: { width: 90, height: 35 },
                                            } as any),
                                        ]
                                    })
                                ],
                                width: { size: 30, type: WidthType.PERCENTAGE },
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    // Content
    const docChildren: any[] = [
        // Date
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { line: 288, before: 200, after: 400 },
            children: [new TextRun({ text: dateLine, font: standardFont, size: 22 })]
        }),

        // Client Info
        new Paragraph({
            spacing: { line: 288, after: 100 },
            children: [
                new TextRun({ text: "A ", font: standardFont, size: 22, bold: true }),
                new TextRun({ text: (data.client_name || "[NOME DA EMPRESA CLIENTE]").toUpperCase(), font: standardFont, size: 22, bold: true })
            ]
        }),
        new Paragraph({
            spacing: { line: 288, after: 300 },
            children: [
                new TextRun({ text: data.cnpj || "[CNPJ da empresa cliente]", font: standardFont, size: 22, bold: true })
            ]
        }),

        // Ref and Code
        new Paragraph({
            spacing: { line: 288, after: 50 },
            children: [
                new TextRun({ text: "Ref: ", font: standardFont, size: 22, bold: true }),
                new TextRun({ text: (data.reference || "[incluir referência da proposta]"), font: standardFont, size: 22 })
            ]
        }),
        new Paragraph({
            spacing: { line: 288, after: 400 },
            children: [
                new TextRun({ text: "Cód.: ", font: standardFont, size: 22, bold: true }),
                new TextRun({ text: proposalCode, font: standardFont, size: 22 })
            ]
        }),

        createTextParagraph("Prezados,", { spacing: 400 }),

        // Introduction
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 288, after: 300 },
            children: [
                new TextRun({ text: "É com grande honra que ", font: standardFont, size: 22 }),
                new TextRun({ text: "SALOMÃO ADVOGADOS", font: standardFont, size: 22, bold: true }),
                new TextRun({ text: ", neste ato representado, respectivamente, por seus sócios ", font: standardFont, size: 22 }),
                ...partners.flatMap((p, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    const connector = arr.length > 1 && isLast ? " e " : (idx > 0 ? ", " : "");
                    const gender = p.gender || 'M';
                    const isFem = ['F', 'Feminino', 'Female'].includes(gender);
                    const civil = (p.civil_status || 'casado').toLowerCase();
                    const nacionalidade = (p.nacionalidade || 'brasileiro').toLowerCase();

                    const textNacionalidade = isFem && nacionalidade.includes('brasileir') ? 'brasileira' : nacionalidade;
                    const textCivil = isFem && civil.includes('casad') ? 'casada' : (isFem && civil.includes('solteir') ? 'solteira' : civil);
                    const textAdvogado = isFem ? 'advogada' : 'advogado';
                    const textInscrito = isFem ? 'inscrita' : 'inscrito';
                    const textPortador = isFem ? 'portadora' : 'portador';

                    return [
                        new TextRun({ text: connector, font: standardFont, size: 22 }),
                        new TextRun({ text: p.name.toUpperCase(), font: boldFont, size: 22, bold: true }),
                        new TextRun({ text: `, ${textNacionalidade}, ${textCivil}, ${textAdvogado}, ${textInscrito} na OAB/${p.oab_uf} sob o nº ${p.oab_numero}, ${textPortador} do CPF/MF nº ${p.cpf}`, font: standardFont, size: 22 }),
                    ];
                }),
                new TextRun({ text: " (“Escritório” ou “Contratado”), vem formular a presente proposta de honorários e prestação de serviços advocatícios, nos seguintes termos.", font: standardFont, size: 22 })
            ]
        }),

        // Section 1: OBJETO
        createTextParagraph("1.	OBJETO E ESCOPO DO SERVIÇO:", { bold: true, spacing: 200 }),
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 288, after: 200 },
            children: [
                new TextRun({ text: "1.1. 	O objeto da presente proposta é a assessoria jurídica a ser realizada pelos advogados que compõem Salomão Advogados (“Escritório”), com vistas à representação judicial em favor do Cliente ", font: standardFont, size: 22 }),
                new TextRun({ text: (data.client_name || "[NOME DA EMPRESA CLIENTE]"), font: standardFont, size: 22, bold: true }),
                new TextRun({ text: " (“Cliente” ou “Contratante”) no ", font: standardFont, size: 22 }),
                new TextRun({ text: (data.observations || "[incluir objeto da disputa]"), font: standardFont, size: 22, bold: true }),
                new TextRun({ text: ".", font: standardFont, size: 22 }),
            ]
        }),
        createTextParagraph("1.2.	Os serviços previstos nesta proposta abrangem a defesa dos interesses do Contratante em toda e qualquer discussão relacionada ao tema tratado.", { spacing: 200 }),
        createTextParagraph("1.3.	Além da análise do caso e definição da estratégia jurídica, o escopo dos serviços profissionais compreende a análise completa dos documentos e informações enviadas pelo Cliente, elaboração das peças processuais, acompanhamento processual, realização de sustentações orais, despachos, bem como todos os atos conexos necessários a atender os interesses do Cliente nos referidos processos.", { spacing: 200 }),
        createTextParagraph("1.4.	Os serviços aqui propostos compreende a participação em reuniões com o Cliente sempre que necessário para entendimentos, esclarecimentos e discussão de estratégias, sempre objetivando a melhor atuação possível do Escritório em defesa dos interesses do Cliente.", { spacing: 200 }),
        createTextParagraph("1.5.	Também está incluída a assessoria jurídica na interlocução com a contraparte, para fins de autocomposição.", { spacing: 200 }),
        createTextParagraph("1.6.	Os serviços aqui propostos não incluem consultoria geral ou outra que não possua correlação com o objeto da proposta.", { spacing: 400 }),

        // Section 2: HONORÁRIOS
        createTextParagraph("2.	HONORÁRIOS E FORMA DE PAGAMENTO:", { bold: true, spacing: 200 }),
        createTextParagraph("2.1.	Considerando as particularidades do caso, propomos honorários da seguinte forma:", { spacing: 200 }),

        // 2.2 Pro Labore
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 288, after: 200 },
            children: [
                new TextRun({ text: "2.2.	Honorários pró-labore de ", font: standardFont, size: 22 }),
                new TextRun({ text: formatCurrency(data.pro_labore), font: standardFont, size: 22, bold: true }),
                new TextRun({ text: getExtensoText(data.pro_labore, false), font: standardFont, size: 22 }),
                new TextRun({ text: `, ${data.pro_labore_clause || "para engajamento no caso, a ser pago em até 10 (dez) dias do aceite dessa proposta;"}`, font: standardFont, size: 22 }),
            ]
        }),
        // Pro Labore Extras
        ...(data.pro_labore_extras || []).map((val, idx) => {
            const clause = (data.pro_labore_extras_clauses || [])[idx] || "";
            return new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: 288, after: 200 },
                children: [
                    new TextRun({ text: `2.2.${idx + 1}.	Honorários pró-labore adicionais de `, font: standardFont, size: 22 }),
                    new TextRun({ text: formatCurrency(val), font: standardFont, size: 22, bold: true }),
                    new TextRun({ text: getExtensoText(val, false), font: standardFont, size: 22 }),
                    new TextRun({ text: `, ${clause}`, font: standardFont, size: 22 }),
                ]
            });
        }),

        // 2.3 Intermediate Fees
        ...(data.intermediate_fees || []).map((val, idx) => {
            const clause = (data.intermediate_fees_clauses || [])[idx] || "[incluir texto]";
            return new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: 288, after: 200 },
                children: [
                    new TextRun({ text: `2.3.${idx + 1}.	Êxito intermediário: `, font: standardFont, size: 22 }),
                    new TextRun({ text: formatCurrency(val), font: standardFont, size: 22, bold: true }),
                    new TextRun({ text: getExtensoText(val, false), font: standardFont, size: 22 }),
                    new TextRun({ text: `, ${clause}`, font: standardFont, size: 22 }),
                ]
            });
        }),
        ...((data.intermediate_fees || []).length === 0 ? [] : [new Paragraph({ text: "" })]),

        // 2.4 Final Success
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 288, after: 200 },
            children: [
                new TextRun({ text: "2.4.	Honorários finais de êxito de ", font: standardFont, size: 22 }),
                // Check if we have fixed fee or percentage or both
                ...(data.final_success_fee ? [
                    new TextRun({ text: formatCurrency(data.final_success_fee), font: standardFont, size: 22, bold: true }),
                    new TextRun({ text: getExtensoText(data.final_success_fee, false), font: standardFont, size: 22 }),
                ] : []),
                ...(data.final_success_fee && data.final_success_percent ? [new TextRun({ text: " e ", font: standardFont, size: 22 })] : []),
                ...(data.final_success_percent ? [
                    new TextRun({ text: formatPercent(data.final_success_percent), font: standardFont, size: 22, bold: true }),
                    new TextRun({ text: getExtensoText(data.final_success_percent, true), font: standardFont, size: 22 }),
                ] : []),
                ...((!data.final_success_fee && !data.final_success_percent) ? [new TextRun({ text: "[incluir valor/percentual]", font: standardFont, size: 22 })] : []),
                new TextRun({ text: `, ${data.final_success_fee_clause || "a serem pagos em 10 (dez) dias do trânsito em julgado da decisão favorável ao Cliente."}`, font: standardFont, size: 22 }),
            ]
        }),

        createTextParagraph("2.5.	Os honorários de êxito serão integralmente devidos pelo Cliente em caso de transação ou rescisão imotivada do presente contrato.", { spacing: 200 }),
        createTextParagraph("2.6.	Nos casos de (a) desistência e/ou renúncia que encerrem as discussões travadas; (b) perda superveniente de seu objeto; (c) destituição dos profissionais do ESCRITÓRIO sem culpa dos mesmos; e/ou (d) cessões e/ou operações envolvendo direitos do Contratante e/ou os interesses do ESCRITÓRIO, as Partes decidem, de boa-fé e na melhor forma de Direito, que todos os valores contemplados nesse Contrato, sem exceção, serão integralmente e automaticamente devidos, mesmo se e independentemente se os eventos de êxito ocorrerem após o desligamento do ESCRITÓRIO e independentemente do teor de quaisquer Decisões Judiciais que sejam proferidas, em reconhecimento, pelo Cliente, de que a estratégia desenhada e executada pelo ESCRITÓRIO afigurou-se determinante à obtenção do sucesso em seu favor. Esses valores serão pagos em até 10 (dez) dias após a ocorrência de quaisquer desses eventos.", { spacing: 400 }),

        // Section 3: CONDIÇÕES GERAIS
        createTextParagraph("3.	CONDIÇÕES GERAIS:", { bold: true, spacing: 200 }),
        createTextParagraph("3.1.	Não estão incluídas nos honorários as despesas relacionadas ao caso, tais como aquelas com custas judiciais, extrajudiciais, passagens aéreas e hospedagens, dentre outras próprias da(o) Cliente. As despesas poderão ser adiantadas pelo Escritório e submetidas à reembolso pela(o) Cliente. Caso venhamos a contratar outros profissionais, peritos, vistoriadores, tradutores ou demais prestadores de serviços em nome da(o) Cliente e sob prévia aprovação de V.Sa., tal contratação será feita na qualidade de mandatários da(o) Cliente ficando V.Sas. desde já responsável pelo pagamento dos honorários dos profissionais supramencionados.", { spacing: 200 }),
        createTextParagraph("3.2.	O atraso no pagamento dos honorários sujeitará o Cliente ao pagamento de multa de mora de 10% (dez por cento), juros de mora de 1% (um por cento) ao mês e correção monetária pela variação positiva do IPCA. Na hipótese de necessidade de cobrança judicial, serão devidos também honorários à razão de 20% (vinte por cento) do valor atualizado do débito.", { spacing: 200 }),
        createTextParagraph("3.3.	Os valores previstos na presente proposta, incluindo eventual limite sobre os honorários de êxito, deverão ser corrigidos monetariamente pela variação positiva do IPCA desde a presente data até sua efetiva liquidação.", { spacing: 200 }),
        createTextParagraph("3.4.	Os valores devidos a título de honorários são líquidos de tributos, independentemente de alterações legislativas futuras.", { spacing: 200 }),
        createTextParagraph("3.5.	Esta proposta foi formulada com base nas informações fornecidas pelo Cliente (ou por pessoa por ele indicada) e em prazo exíguo, buscando o melhor custo-benefício ao Cliente. Verificando-se, no decorrer do processo, divergência entre tais informações e os documentos constantes dos autos, ou a ampliação do escopo originalmente considerado, os honorários poderão ser revistos para recompor o equilíbrio econômico-financeiro, o que poderá ser feito mediante aditivo contratual ou qualquer outra solicitação formal a ser apresentado pelo Escritório.", { spacing: 200 }),
        createTextParagraph("3.6.	A contratação do Escritório para a especialidade ora pactuada não caracteriza, por si só, impedimento para que o Escritório atue em assuntos não relacionados de outro cliente, mesmo quando os interesses do outro cliente possam ser eventualmente adversos ao Cliente, desde que: (i) não haja adversidade direta em processo ou procedimento no qual o Escritório represente o Cliente; (ii) não se utilize, nem se ponha em risco, informação confidencial do Cliente; e (iii) sejam observadas barreiras éticas (Chinese wall) e segregação de equipes, quando cabível.", { spacing: 200 }),
        createTextParagraph("3.7.	Esta proposta constitui-se em contrato entre as partes com respeito ao assunto objeto desta, podendo ser modificada ou substituída somente mediante autorização por escrito de ambas as partes envolvidas. Em caso de divergência das cláusulas do presente instrumento em relação a outro contrato enviado pelo Cliente, ainda que posterior, prevalecerão as do presente instrumento.", { spacing: 200 }),
        createTextParagraph("3.8.	O aceite em relação a presente contratação poderá se dar de forma expressa ou tácita, sendo que neste último caso se dará a partir do início da prestação de serviços pelos Contratados.", { spacing: 200 }),
        createTextParagraph("3.9.	Em qualquer caso, a responsabilidade dos Contratados será limitada aos valores efetivamente recebidos por este. Os honorários de sucumbência serão devidos exclusivamente ao Escritório.", { spacing: 200 }),
        createTextParagraph("3.10.	Mediante expressa autorização da(o) Cliente, os Contratados poderão indicar outros advogados para atuar na referida demanda, cujos custos da contratação serão de responsabilidade d(ao) Cliente.", { spacing: 200 }),
        createTextParagraph("3.11.	Esta proposta obriga os herdeiros e sucessores das Partes para o fiel cumprimento de suas obrigações.", { spacing: 200 }),
        createTextParagraph("3.12.	O Escritório contratado adota as medidas adequadas, de acordo com as boas práticas da legislação, para impedir qualquer atividade fraudulenta por si, seus advogados, estagiários, e/ou por quaisquer fornecedores, agentes, contratadas, subcontratadas e/ou os empregados.", { spacing: 200 }),
        createTextParagraph("3.13.	As partes se comprometem a cumprir toda a legislação aplicável sobre segurança da informação, privacidade e proteção de dados, inclusive a Constituição Federal, o Código de Defesa do Consumidor, o Código Civil, o Marco Civil da Internet (Lei Federal n. 12.965/2014), seu decreto regulamentador (Decreto 8.771/2016), a Lei Geral de Proteção de Dados (Lei Federal n. 13.709/2018), e demais normas setoriais ou gerais sobre o tema, se comprometendo a tratar apenas os dados mencionados e/ou nas formas dispostas neste instrumento mediante instruções expressas do controlador de dados (parte que determina as finalidades e os meios de tratamento de dados pessoais); ou com o devido embasamento legal, sem transferi-los a qualquer terceiro, exceto se expressamente autorizado por este ou outro instrumento que as vincule.", { spacing: 200 }),
        createTextParagraph("3.14.	As partes concordam em tratar e manter todas e quaisquer informações (escritas ou verbais) como confidenciais, ficando vedado, por ação ou omissão, a revelação de quaisquer informações, documentos entre outros, obtidos nas tratativas e/ou na execução do Contrato, sem prévio e expresso consentimento da outra parte. Tal regra não abrange as informações que se encontram em domínio público nem impede a menção da(o) Contratante como cliente do Escritório.", { spacing: 200 }),
        createTextParagraph("3.15.	As partes elegem o foro da Comarca da Capital da Cidade do Rio de Janeiro para dirimir todas as controvérsias oriundas do presente instrumento, com renúncia expressa a qualquer outro.", { spacing: 200 }),
        createTextParagraph("O Cliente e o Escritório concordam que esta proposta poderá ser firmada de maneira digital por todos os seus signatários. Para este fim, serão utilizados serviços disponíveis no mercado e amplamente utilizados que possibilitam a segurança de assinatura digital por meio de sistemas de certificação capazes de validar a autoria de assinatura eletrônica, bem como de certificar sua integridade, através de certificado digital emitido no padrão ICP-Brasil, autorizando, inclusive, a sua assinatura digital por meio de plataformas digitais.", { spacing: 400 }),

        createTextParagraph("Cordialmente,", { alignment: AlignmentType.CENTER, spacing: 300 }), // Increased spacing (two enters = roughly 300-400)

        // Signatures
        ...partners.map(p => {
            const underline = "_".repeat(Math.max(p.name.length + 10, 30));
            return [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { line: 288, before: 400 },
                    children: [new TextRun({ text: underline, font: standardFont, size: 22 })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: p.name.toUpperCase(), font: boldFont, size: 22, bold: true }),
                    ]
                })
            ];
        }).flat(),

        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: "SALOMÃO ADVOGADOS", font: boldFont, size: 22, bold: true }),
            ]
        }),

        new Paragraph({ text: "", spacing: { line: 288, after: 600 } }),

        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 288, before: 400 },
            children: [new TextRun({ text: "_".repeat(Math.max((data.client_name || "").length + 10, 40)), font: standardFont, size: 22 })]
        }),
        createTextParagraph((data.client_name || "[CLIENTE]").toUpperCase(), { bold: true, alignment: AlignmentType.CENTER, spacing: 200 }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: "De acordo em:     /     /       ", font: standardFont, size: 22 }),
            ]
        }),
        new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: 288, before: 600 },
            children: [
                new TextRun({ text: "Testemunha 01: __________________________", font: standardFont, size: 22 }),
            ]
        }),
        new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: 288, before: 300 },
            children: [
                new TextRun({ text: "Testemunha 02: __________________________", font: standardFont, size: 22 }),
            ]
        }),
    ];

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: { top: 1000, right: 1440, bottom: 1440, left: 1440 }
                    }
                },
                headers: { default: header },
                footers: { default: footer },
                children: docChildren,
            },
        ],
    });

    return await Packer.toBlob(doc);
};
