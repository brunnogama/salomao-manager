// Mocking the helper
const isValidDate = (d) => {
    return d instanceof Date && !isNaN(d.getTime());
};

const statusDatesRaw = ['2023-01-01', 'invalid-date', ''];

// Simulated logic from useDashboardData.ts
const statusDates = statusDatesRaw
    .filter(d => d && d !== '')
    .map(d => new Date(d + 'T12:00:00'))
    .filter(d => isValidDate(d)); // This is the fix

console.log("Status Dates:", statusDates.map(d => d.toString()));

let dataEntradaReal = null;
if (statusDates.length > 0) {
    const timestamps = statusDates.map(d => d.getTime());
    dataEntradaReal = new Date(Math.min(...timestamps));
} else {
    dataEntradaReal = new Date(); // Fallback
}

// Fallback final logic
if (!isValidDate(dataEntradaReal)) {
    dataEntradaReal = new Date();
}

console.log("Data Entrada Real:", dataEntradaReal.toString());

try {
    const mesAnoEntrada = dataEntradaReal.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    console.log("Mes Ano (Success):", mesAnoEntrada);
} catch (error) {
    console.error("FAILED: Crashed with error:", error.message);
    process.exit(1);
}
