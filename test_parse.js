const safeParseFloat = (value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;

    // Remove "R$", espaços, pontos de milhar e substitui vírgula por ponto
    const cleanStr = value.toString().replace(/[^\d,-]/g, '').replace(',', '.');
    const floatVal = parseFloat(cleanStr);

    return isNaN(floatVal) ? 0 : floatVal;
};

const testStrings = [
    "R$ 1.500.000,00",
    "R$\u00A01.500.000,00", // Non-breaking space
    "1.500.000,00",
    "R$ 0,00"
];

testStrings.forEach(s => {
    console.log(`Input: "${s}" -> Output: ${safeParseFloat(s)} (type: ${typeof safeParseFloat(s)})`);
});
