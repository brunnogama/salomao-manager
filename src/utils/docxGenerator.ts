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

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {
            page: {
                margin: {
                    top: 1000, // Reduced top margin for header
                    right: 1440, // 1 inch
                    bottom: 1440, // 1 inch
                    left: 1440, // 1 inch
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
                      width: 200, // Adjust sizing
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
                                        transformation: { width: 400, height: 40 }, // Approx size
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
                                        transformation: { width: 100, height: 40 }, // Approx size
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
                        size: 22, // 11pt
                        highlight: "yellow", // As requested: [data de hoje] styled
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
                        highlight: "yellow"
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
                        highlight: "yellow"
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
                        highlight: "yellow"
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
                        highlight: "yellow"
                    })
                ]
            }),

            new Paragraph({
                spacing: { after: 400 },
                children: [ new TextRun({ text: "Prezado Sr.", font: "Arial", size: 22 }) ]
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
                        highlight: "yellow"
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
                         highlight: "yellow"
                     }),
                     new TextRun({ text: " no ", font: "Arial", size: 22 }),
                     new TextRun({
                         text: "[incluir objeto da disputa]",
                         font: "Arial",
                         size: 22,
                         highlight: "yellow"
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

            // 2.2 Pro Labore
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 200 },
                children: [
                     new TextRun({ text: "2.2.\tHonorários pró-labore de ", font: "Arial", size: 22 }),
                     new TextRun({
                         text: data.pro_labore || "[incluir valor]",
                         font: "Arial",
                         size: 22,
                         highlight: "yellow"
                     }),
                     new TextRun({ text: " para engajamento no caso...", font: "Arial", size: 22 }),
                ]
            }),

             // 2.3 Success Fee
             new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 200 },
                children: [
                     new TextRun({ text: "2.3.\tÊxito intermediário de êxito: ", font: "Arial", size: 22 }),
                     new TextRun({
                         text: (data.intermediate_fees && data.intermediate_fees.length > 0 ? data.intermediate_fees.join(', ') : "[incluir valor]"),
                         font: "Arial",
                         size: 22,
                         highlight: "yellow"
                     }),
                ]
            }),

             // 2.4 Final Success Fee
             new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 200 },
                children: [
                     new TextRun({ text: "2.4.\tHonorários finais de êxito de ", font: "Arial", size: 22 }),
                     new TextRun({
                         text: data.final_success_fee || "[incluir valor]",
                         font: "Arial",
                         size: 22,
                         highlight: "yellow"
                     }),
                     new TextRun({ text: ", a serem pagos em 10 (dez) dias do trânsito em julgado...", font: "Arial", size: 22 }),
                ]
            }),

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
                         highlight: "yellow"
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
                         highlight: "yellow"
                     }),
                ]
            }),

             new Paragraph({
                spacing: { before: 200 },
                children: [ new TextRun({ text: "De acordo em:    /    /", font: "Arial", size: 22 }) ]
            }),
        ]
      },
    ],
  });

  return await Packer.toBlob(doc);
};
