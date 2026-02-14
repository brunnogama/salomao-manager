// Mock parseCurrency
const parseCurrency = (value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    const clean = value.replace(/[R$\s.]/g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
};

// Mock Contract data with INVALID types for arrays
const contract = {
    pro_labore: 'R$ 1.000,00',
    pro_labore_extras: 'should be array but is string', // ERROR SOURCE
    intermediate_fees: { not: 'an array' }, // ERROR SOURCE
    final_success_fee: 'R$ 5.000,00',
    final_success_extras: null, // ERROR SOURCE
    other_fees: 'R$ 0,00',
    other_fees_extras: undefined, // ERROR SOURCE
    fixed_monthly_fee: 'R$ 2.000,00',
    fixed_monthly_extras: 12345, // ERROR SOURCE
    percent_extras: 'invalid string' // ERROR SOURCE
};

try {
    // 1. Pró-Labore
    const proLaboreBase = parseCurrency(contract.pro_labore);
    const proLaboreExtrasList = contract.pro_labore_extras;
    // FIX APPLIED HERE
    const proLaboreExtrasTotal = (Array.isArray(proLaboreExtrasList) ? proLaboreExtrasList : []).reduce((acc, val) => acc + parseCurrency(val), 0) || 0;
    console.log('Pro Labore Extras Total:', proLaboreExtrasTotal);

    // 2. Intermediate
    const intermediateList = contract.intermediate_fees;
    // FIX APPLIED HERE
    const intermediateTotal = (Array.isArray(intermediateList) ? intermediateList : []).reduce((acc, val) => acc + parseCurrency(val), 0) || 0;
    console.log('Intermediate Total:', intermediateTotal);

    // 3. Percent Extras Map Check
    const percentExtras = contract.percent_extras;
    // FIX APPLIED HERE
    if (percentExtras && Array.isArray(percentExtras)) {
        percentExtras.map(val => console.log(val));
    } else {
        console.log('Percent Extras: Safe (skipped string/invalid)');
    }

    console.log('SUCCESS: No crash occurred.');
} catch (error) {
    console.error('FAILED: Crashed with error:', error.message);
    process.exit(1);
}
