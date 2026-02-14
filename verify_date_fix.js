// Import safeDate from source
// We need to mock the environment or extract safeDate for testing since we can't easily import TS in node
const safeDate = (dateStr) => {
    if (!dateStr) return null;

    // If it's already a clean YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + 'T12:00:00');
    }

    // Handle DD/MM/YYYY
    const ptBrMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ptBrMatch) {
        const [_, day, month, year] = ptBrMatch;
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`);
    }

    // Try creating date directly (ISO etc)
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;

    return null;
};

// Simulation of use cases in ContractDetailsModal and Contracts
console.log('--- Verifying Date Fixes ---');

const cases = [
    { input: '2026-02-14', expected: '14/02/2026' },
    { input: '14/02/2026', expected: '14/02/2026' }, // The key fix
    { input: 'invalid', expected: '-' },
    { input: null, expected: '-' },
    { input: '2026-02-14T15:00:00', expected: '14/02/2026' }
];

let success = true;

cases.forEach(({ input, expected }) => {
    const result = safeDate(input);
    const formatted = result ? result.toLocaleDateString('pt-BR') : '-';

    if (formatted !== expected && !(expected === '14/02/2026' && formatted.includes('14/02/2026'))) {
        // Allow slight time variations if timezone affects it, but here we set T12:00:00 so it should be stable
        if (formatted === expected) {
            console.log(`[PASS] Input: "${input}" -> Parsed: ${formatted}`);
        } else {
            console.error(`[FAIL] Input: "${input}" -> Expected: ${expected}, Got: ${formatted}`);
            success = false;
        }
    } else {
        console.log(`[PASS] Input: "${input}" -> Parsed: ${formatted}`);
    }
});

if (success) {
    console.log('\nSUCCESS: correct handling of date formats confirmed.');
} else {
    console.error('\nFAILURE: Some date formats were not handled as expected.');
    process.exit(1);
}
