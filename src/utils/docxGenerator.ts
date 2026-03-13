import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, Header, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { Contract } from '../types/controladoria';
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

export const generateProposalDocx = async (data: ProposalData, proposalCode: string) => {
    // Fetch images
    const [logoBuffer, footer1Buffer, footer2Buffer] = await Promise.all([
        fetchImage('/logo-salomao.png'),
        fetchImage('/rodape1.png'),
        fetchImage('/rodape2.png')
    ]);

    const standardFont = "Aptos";
    const boldFont = "Aptos";

    // --- SECTIONS ---

    // Header with centered logo
    const header = new Header({
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new ImageRun({
                        data: logoBuffer,
                        transformation: {
                            width: 180, // Adjusted width
                            height: 48,  // Adjusted height
                        },
                    }),
                ],
            }),
        ],
    });

    // Footer with two distributed images using a table to force side-by-side
    const footer = new Header({
        children: [
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
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
                                                transformation: {
                                                    width: 220,
                                                    height: 38,
                                                },
                                            }),
                                        ],
                                    }),
                                ],
                                borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } },
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new ImageRun({
                                                data: footer2Buffer,
                                                transformation: {
                                                    width: 220,
                                                    height: 38,
                                                },
                                            }),
                                        ],
                                    }),
                                ],
                                borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } },
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    // Replace [código proposta] in custom text
    const processedText = (data.custom_body_text || "").replace(/\[código proposta\]/g, proposalCode);

    const docChildren: any[] = processedText.split('\n').map(paragraphText => {
        if (!paragraphText.trim()) {
            return new Paragraph({ spacing: { line: 276, after: 0 } });
        }

        let align: any = AlignmentType.JUSTIFIED;
        let pText = paragraphText;

        if (pText.startsWith('<<RIGHT>>')) {
            align = AlignmentType.RIGHT;
            pText = pText.replace('<<RIGHT>>', '');
        } else if (pText.startsWith('<<CENTER>>')) {
            align = AlignmentType.CENTER;
            pText = pText.replace('<<CENTER>>', '');
        } else if (pText.startsWith('<<LEFT>>')) {
            align = AlignmentType.LEFT;
            pText = pText.replace('<<LEFT>>', '');
        }

        const parts = pText.split(/(\*\*.*?\*\*)/g);
        const children = parts.filter(p => p).map(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return new TextRun({
                    text: part.slice(2, -2),
                    font: boldFont,
                    size: 22,
                    bold: true
                });
            }
            return new TextRun({
                text: part,
                font: standardFont,
                size: 22
            });
        });

        return new Paragraph({
            alignment: align,
            spacing: { line: 276, after: 0 },
            children
        });
    });

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 2200,    // Reduced to leave one line of space after logo
                            bottom: 1800, // Reduced to leave one line of space before footer
                            left: 1440,
                            right: 1440,
                        }
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
