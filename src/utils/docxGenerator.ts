import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, Header, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom } from 'docx';
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
    custom_body_text?: string;
    full_success_clauses?: any[];
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

    // Fetch the full letterhead image
    const letterheadBuffer = await fetchImage('/papel-timbrado.png');

    const standardFont = "Arial";
    const boldFont = "Arial";

    const createTextParagraph = (text: string, options: { bold?: boolean, size?: number, color?: string, alignment?: any, spacing?: number } = {}) => {
        return new Paragraph({
            alignment: options.alignment || AlignmentType.JUSTIFIED,
            spacing: { line: 240, after: options.spacing !== undefined ? options.spacing : 200 },
            children: [
                new TextRun({
                    text,
                    font: options.bold ? boldFont : standardFont,
                    size: options.size || 20, // Slightly smaller to fit A4 better
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

    // Full Page Background (Letterhead)
    const header = new Header({
        children: [
            new Paragraph({
                children: [
                    new ImageRun({
                        data: letterheadBuffer,
                        transformation: {
                            width: 595, // A4 width pts
                            height: 842, // A4 height pts
                        },
                        floating: {
                            horizontalPosition: {
                                relative: HorizontalPositionRelativeFrom.PAGE,
                                offset: 0,
                            },
                            verticalPosition: {
                                relative: VerticalPositionRelativeFrom.PAGE,
                                offset: 0,
                            },
                            behindText: true,
                        },
                    } as any),
                ],
            }),
        ],
    });

    // Content
    const docChildren: any[] = [
        // Date
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { line: 240, after: 600 },
            children: [new TextRun({ text: dateLine, font: standardFont, size: 20 })]
        }),

        // Client Info
        new Paragraph({
            spacing: { line: 240, after: 100 },
            children: [
                new TextRun({ text: "AO ", font: standardFont, size: 20, bold: true }),
                new TextRun({ text: (data.client_name || "[NOME DA EMPRESA CLIENTE]").toUpperCase(), font: standardFont, size: 20, bold: true })
            ]
        }),
        new Paragraph({
            spacing: { line: 240, after: 300 },
            children: [
                new TextRun({ text: data.cnpj || "[CNPJ da empresa cliente]", font: standardFont, size: 20, bold: true })
            ]
        }),

        // Ref and Code
        new Paragraph({
            spacing: { line: 240, after: 50 },
            children: [
                new TextRun({ text: "Ref: ", font: standardFont, size: 20, bold: true }),
                new TextRun({ text: (data.reference || "[incluir referência da proposta]"), font: standardFont, size: 20 })
            ]
        }),
        new Paragraph({
            spacing: { line: 240, after: 400 },
            children: [
                new TextRun({ text: "Cód.: ", font: standardFont, size: 20, bold: true }),
                new TextRun({ text: proposalCode, font: standardFont, size: 20 })
            ]
        }),

        createTextParagraph("Prezados,", { spacing: 400 }),

        // Introduction
        new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 240, after: 300 },
            children: [
                new TextRun({ text: "É com grande honra que ", font: standardFont, size: 20 }),
                new TextRun({ text: "SALOMÃO ADVOGADOS", font: standardFont, size: 20, bold: true }),
                new TextRun({ text: ", neste ato representado, respectivamente, por seus sócios ", font: standardFont, size: 20 }),
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
                        new TextRun({ text: connector, font: standardFont, size: 20 }),
                        new TextRun({ text: p.name.toUpperCase(), font: boldFont, size: 20, bold: true }),
                        new TextRun({ text: `, ${textNacionalidade}, ${textCivil}, ${textAdvogado}, ${textInscrito} na OAB/${p.oab_uf} sob o nº ${p.oab_numero}, ${textPortador} do CPF/MF nº ${p.cpf}`, font: standardFont, size: 20 }),
                    ];
                }),
                new TextRun({ text: ", vem formular a presente proposta de honorários.", font: standardFont, size: 20 })
            ]
        }),

        // Sections
        ...(data.custom_body_text
            ? data.custom_body_text.split('\n\n').filter(p => p.trim()).map(paragraphText => {
                const isHeading = /^\d+\.\s*[A-ZÀ-Ú\s]+:$/.test(paragraphText);
                return createTextParagraph(paragraphText, {
                    bold: isHeading || undefined,
                    spacing: 200
                });
            })
            : [
                createTextParagraph("1. OBJETO E ESCOPO DO SERVIÇO:", { bold: true }),
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { line: 240, after: 200 },
                    children: [
                        new TextRun({ text: "1.1. O objeto da presente proposta é a assessoria jurídica... em favor do Cliente ", font: standardFont, size: 20 }),
                        new TextRun({ text: (data.client_name || "[NOME DA EMPRESA CLIENTE]"), font: standardFont, size: 20, bold: true }),
                        new TextRun({ text: " no ", font: standardFont, size: 20 }),
                        new TextRun({ text: (data.observations || "[objeto]"), font: standardFont, size: 20, bold: true }),
                    ]
                }),
                createTextParagraph("2. HONORÁRIOS E FORMA DE PAGAMENTO:", { bold: true }),
                ...(data.full_success_clauses || []).map((clause: any, idx: number) => {
                    const isPercent = clause.type === 'percent';
                    return new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { line: 240, after: 200 },
                        children: [
                            new TextRun({ text: `2.${3 + idx}. Honorários de êxito de `, font: standardFont, size: 20 }),
                            new TextRun({ text: isPercent ? formatPercent(clause.value) : formatCurrency(clause.value), font: standardFont, size: 20, bold: true }),
                            new TextRun({ text: getExtensoText(clause.value, isPercent), font: standardFont, size: 20 }),
                            new TextRun({ text: `, ${clause.description}`, font: standardFont, size: 20 }),
                        ]
                    });
                }),
            ]
        ),

        // Signatures
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 240, before: 1200, after: 400 },
            children: [new TextRun({ text: "Cordialmente,", font: standardFont, size: 20 })]
        }),

        ...partners.map(p => ([
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: p.name.toUpperCase(), font: boldFont, size: 20, bold: true })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "SALOMÃO ADVOGADOS", font: boldFont, size: 20, bold: true })]
            }),
        ])).flat(),

        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 240, before: 800 },
            children: [new TextRun({ text: "____________________________________", font: standardFont, size: 20 })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: (data.client_name || "[CLIENTE]").toUpperCase(), font: boldFont, size: 20, bold: true })]
        }),
    ];

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 3030,    // 18% of A4 (53.46mm)
                            bottom: 2700, // 16% of A4 (47.52mm)
                            left: 1440,
                            right: 1440,
                        }
                    }
                },
                headers: { default: header },
                children: docChildren,
            },
        ],
    });

    return await Packer.toBlob(doc);
};
