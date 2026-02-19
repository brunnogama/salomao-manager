import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, Header, Footer, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';
import { Contract } from '../types/controladoria'; // Adjust path if needed
import { saveAs } from 'file-saver';

// Helper to fetch image as ArrayBuffer
const fetchImage = async (url: string): Promise<ArrayBuffer> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blob.arrayBuffer();
};

export const generateProposalDocx = async (data: Contract, proposalCode: string) => {
    const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    // Fetch images
    // Assuming images are in public folder, we can fetch them by URL (relative to root)
    // In production/dev, these should be accessible.
    const logoBuffer = await fetchImage('/logo-salomao.png');
    const footer1Buffer = await fetchImage('/rodape1.png');
    const footer2Buffer = await fetchImage('/rodape2.png');

    // Helper to create paragraphs for clauses
    // Logic matches preview: 2.1 is header. 2.2 start pro labore.
    // We need to return an array of Paragraphs.

    const createClauseParagraph = (num: string, titleStart: string, value: string, description: string) => {
        return new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
            children: [
                new TextRun({ text: `${num}.\t${titleStart} `, font: "Arial", size: 22 }),
                new TextRun({
                    text: value || "[incluir valor]",
                    font: "Arial",
                    size: 22,
                    // highlight: "yellow" // Removed as requested
                }),
                new TextRun({ text: ` ${description || ""}`, font: "Arial", size: 22 }),
            ]
        });
    };

    const clauseParagraphs: Paragraph[] = [];

    // Pro Labore
    let currentIndex = 2; // Starts at 2.2
    const proLaboreValues = [data.pro_labore, ...(data.pro_labore_extras || [])].filter(v => v !== undefined); // Include null/undefined checks
    const proLaboreClauses = [data.pro_labore_clause, ...(data.pro_labore_extras_clauses || [])];

    // We iterate based on the longer array to be safe, or just proLaboreValues
    // Actually, we should probably rely on the count of items in proposalData which we don't have directly here, 
    // but we have the data arrays. 
    // Let's assume proLaboreValues dictates the count (as we always have value + desc)

    // In Proposals.tsx we ensured that for every value we assume there's a description in the parallel array.

    if (proLaboreValues.length > 0) {
        proLaboreValues.forEach((val, idx) => {
            const desc = proLaboreClauses[idx] || "";
            clauseParagraphs.push(createClauseParagraph(`2.${currentIndex}`, "Honorários pró-labore de", val!, desc!));
            currentIndex++;
        });
    } else {
        // Fallback if empty (shouldn't happen with default state)
        clauseParagraphs.push(createClauseParagraph(`2.${currentIndex}`, "Honorários pró-labore de", "[valor]", ""));
        currentIndex++;
    }

    // Intermediate
    const intermediateValues = data.intermediate_fees || [];
    const intermediateClauses = data.intermediate_fees_clauses || [];

    if (intermediateValues.length > 0) {
        intermediateValues.forEach((val, idx) => {
            const desc = intermediateClauses[idx] || "";
            clauseParagraphs.push(createClauseParagraph(`2.${currentIndex}`, "Êxito intermediário: ", val, desc));
            currentIndex++;
        });
    }

    // Final Success
    const successValues = [data.final_success_fee, ...(data.final_success_extras || [])].filter(v => v !== undefined && v !== null && v !== "");
    const successClauses = [data.final_success_fee_clause, ...(data.final_success_extras_clauses || [])];

    if (successValues.length > 0) {
        successValues.forEach((val, idx) => {
            const desc = successClauses[idx] || "";
            clauseParagraphs.push(createClauseParagraph(`2.${currentIndex}`, "Honorários finais de êxito de", val!, desc!));
            currentIndex++;
        });
    }


    // Create the document
    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 1000,
                            right: 1440,
                            bottom: 1440,
                            left: 1440,
                        }
                    }
                },
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new ImageRun({
                                        data: logoBuffer,
                                        transformation: {
                                            width: 200,
                                            height: 50,
                                        },
                                    }),
                                ],
                            }),
                            new Paragraph({ text: "" }), // Spacing
                        ],
                    }),
                },
                footers: {
                    default: new Footer({
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
                                                                transformation: { width: 400, height: 40 },
                                                            }),
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
                                                                transformation: { width: 100, height: 40 },
                                                            }),
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
                    }),
                },
                children: [
                    // Date
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 400, after: 400 },
                        children: [
                            new TextRun({
                                text: today,
                                font: "Arial",
                                size: 22,
                                // highlight: "yellow", // Removed
                            })
                        ]
                    }),

                    // Addressee
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({ text: "AO ", font: "Arial", size: 22, bold: true }),
                            new TextRun({
                                text: (data.client_name || "[NOME DA EMPRESA CLIENTE]").toUpperCase(),
                                font: "Arial",
                                size: 22,
                                bold: true,
                                // highlight: "yellow" // Removed
                            })
                        ]
                    }),

                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({
                                text: data.cnpj || "[CNPJ da empresa cliente]",
                                font: "Arial",
                                size: 22,
                                bold: true,
                                // highlight: "yellow" // Removed
                            })
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { after: 200 } }), // Spacing

                    // Ref and Code
                    new Paragraph({
                        spacing: { after: 100 },
                        children: [
                            new TextRun({ text: "Ref: ", font: "Arial", size: 22, bold: true }),
                            new TextRun({
                                text: (data.observations || "[incluir objeto da proposta]"),
                                font: "Arial",
                                size: 22,
                                // highlight: "yellow" // Removed
                            })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 400 },
                        children: [
                            new TextRun({ text: "Cód.: ", font: "Arial", size: 22, bold: true }),
                            new TextRun({
                                text: proposalCode,
                                font: "Arial",
                                size: 22,
                                // highlight: "yellow" // Removed
                            })
                        ]
                    }),

                    new Paragraph({
                        spacing: { after: 400 },
                        children: [new TextRun({ text: "Prezado Sr.", font: "Arial", size: 22 })]
                    }),

                    // Introduction Paragraph
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 200 },
                        children: [
                            new TextRun({ text: "É com grande honra que ", font: "Arial", size: 22 }),
                            new TextRun({ text: "SALOMÃO ADVOGADOS", font: "Arial", size: 22, bold: true }),
                            new TextRun({ text: ", neste ato representado, respectivamente, por seus sócios ", font: "Arial", size: 22 }),
                            new TextRun({
                                text: (data.partner_name || "[incluir nome do sócio]"),
                                font: "Arial",
                                size: 22,
                                bold: true,
                                // highlight: "yellow" // Removed
                            }),
                            new TextRun({ text: ", brasileiro, casado, advogado... (texto padrão omitido para brevidade)... vem formular a presente proposta...", font: "Arial", size: 22 })
                        ]
                    }),

                    // 1. OBJETO
                    new Paragraph({
                        spacing: { before: 400, after: 200 },
                        children: [
                            new TextRun({ text: "1.\tOBJETO E ESCOPO DO SERVIÇO:", font: "Arial", size: 22, bold: true })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 200 },
                        children: [
                            new TextRun({ text: "1.1.\tO objeto da presente proposta é a assessoria jurídica... em favor do Cliente ", font: "Arial", size: 22 }),
                            new TextRun({
                                text: (data.client_name || "[NOME DA EMPRESA CLIENTE]"),
                                font: "Arial",
                                size: 22,
                                // highlight: "yellow" // Removed
                            }),
                            new TextRun({ text: " no ", font: "Arial", size: 22 }),
                            new TextRun({
                                text: "[incluir objeto da disputa]",
                                font: "Arial",
                                size: 22,
                                // highlight: "yellow" // Removed
                            }),
                            new TextRun({ text: ".", font: "Arial", size: 22 }),
                        ]
                    }),

                    // 2. HONORÁRIOS
                    new Paragraph({
                        spacing: { before: 400, after: 200 },
                        children: [
                            new TextRun({ text: "2.\tHONORÁRIOS E FORMA DE PAGAMENTO:", font: "Arial", size: 22, bold: true })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 200 },
                        children: [
                            new TextRun({ text: "2.1.\tConsiderando as particularidades do caso, propomos honorários da seguinte forma:", font: "Arial", size: 22 }),
                        ]
                    }),

                    // DYNAMIC PARAGRAPHS HERE
                    ...clauseParagraphs,

                    new Paragraph({ text: "", spacing: { after: 400 } }), // Spacing

                    // Signature Section
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400, after: 100 },
                        children: [
                            new TextRun({ text: "Cordialmente,", font: "Arial", size: 22 }),
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400 },
                        children: [
                            new TextRun({
                                text: (data.partner_name || "[Incluir nome do sócio]"),
                                font: "Arial",
                                size: 22,
                                bold: true,
                                // highlight: "yellow" // Removed
                            }),
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: "SALOMÃO ADVOGADOS", font: "Arial", size: 22, bold: true }),
                        ]
                    }),


                    new Paragraph({ text: "", spacing: { after: 400 } }), // Spacing

                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400 },
                        children: [
                            new TextRun({
                                text: (data.client_name || "[CLIENTE]"),
                                font: "Arial",
                                size: 22,
                                bold: true,
                                // highlight: "yellow" // Removed
                            }),
                        ]
                    }),

                    new Paragraph({
                        spacing: { before: 200 },
                        children: [new TextRun({ text: "De acordo em:    /    /", font: "Arial", size: 22 })]
                    }),
                ]
            },
        ],
    });

    return await Packer.toBlob(doc);
};
