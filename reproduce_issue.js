const statusDatesRaw = ['2023-01-01', 'invalid-date', ''];

const statusDates = statusDatesRaw
    .filter(d => d && d !== '')
    .map(d => new Date(d + 'T12:00:00'));

console.log("Status Dates:", statusDates.map(d => d.toString()));

let dataEntradaReal = null;
if (statusDates.length > 0) {
    const timestamps = statusDates.map(d => d.getTime());
    console.log("Timestamps:", timestamps);
    const minTime = Math.min(...timestamps);
    console.log("Min Time:", minTime);
    dataEntradaReal = new Date(minTime);
} else {
    dataEntradaReal = new Date();
}

console.log("Data Entrada Real:", dataEntradaReal.toString());

try {
    const mesAnoEntrada = dataEntradaReal.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    console.log("Mes Ano:", mesAnoEntrada);
} catch (error) {
    console.error("Caught Expected Error:", error.message);
}

try {
    const iso = dataEntradaReal.toISOString();
    console.log("ISO:", iso);
} catch (error) {
    console.error("Caught Expected Error ISO:", error.message);
}
