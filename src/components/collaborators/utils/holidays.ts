export interface Feriado {
    data_evento: string; // YYYY-MM-DD
    titulo: string;
    tipo: string;
}

function getEaster(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-based
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function toISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const FIXED_HOLIDAYS = [
    // Nacionais
    { day: 1, month: 1, name: 'Confraternização Universal', type: 'Feriado Nacional' },
    { day: 21, month: 4, name: 'Tiradentes', type: 'Feriado Nacional' },
    { day: 1, month: 5, name: 'Dia do Trabalho', type: 'Feriado Nacional' },
    { day: 7, month: 9, name: 'Independência do Brasil', type: 'Feriado Nacional' },
    { day: 12, month: 10, name: 'Nossa Senhora Aparecida', type: 'Feriado Nacional' },
    { day: 2, month: 11, name: 'Finados', type: 'Feriado Nacional' },
    { day: 15, month: 11, name: 'Proclamação da República', type: 'Feriado Nacional' },
    { day: 20, month: 11, name: 'Dia da Consciência Negra', type: 'Feriado Nacional' },
    { day: 25, month: 12, name: 'Natal', type: 'Feriado Nacional' },

    // Rio de Janeiro
    { day: 20, month: 1, name: 'São Sebastião (Feriado - RJ)', type: 'Feriado Municipal' },
    { day: 23, month: 4, name: 'São Jorge (Feriado - RJ)', type: 'Feriado Estadual' },

    // Vitória
    { day: 8, month: 9, name: 'Nossa Senhora da Vitória (Feriado - Vitória)', type: 'Feriado Municipal' },

    // Belém
    { day: 12, month: 1, name: 'Fundação de Belém (Feriado - Belém)', type: 'Feriado Municipal' },
    { day: 15, month: 8, name: 'Adesão do Grão-Pará (Feriado - PA)', type: 'Feriado Estadual' },
    { day: 8, month: 12, name: 'Nossa Sra. da Conceição (Feriado - Belém)', type: 'Feriado Municipal' },

    // Florianópolis
    { day: 23, month: 3, name: 'Aniversário de Florianópolis (Feriado - Floripa)', type: 'Feriado Municipal' },

    // São Paulo
    { day: 25, month: 1, name: 'Aniversário de São Paulo (Feriado - SP)', type: 'Feriado Municipal' },
    { day: 9, month: 7, name: 'Revolução Constitucionalista (Feriado - SP)', type: 'Feriado Estadual' },

    // Salvador
    { day: 2, month: 7, name: 'Independência da Bahia (Feriado - BA)', type: 'Feriado Estadual' },
    { day: 8, month: 12, name: 'Nossa Sra. da Conceição da Praia (Feriado - Salvador)', type: 'Feriado Municipal' },
];

export function getFeriadosDoAno(year: number): Feriado[] {
    const easter = getEaster(year);

    const carnaval = addDays(easter, -47);
    const paixaoDeCristo = addDays(easter, -2);
    const corpusChristi = addDays(easter, 60);

    const holidays: Feriado[] = [
        { data_evento: toISO(carnaval), titulo: 'Carnaval', tipo: 'Feriado Nacional' },
        { data_evento: toISO(paixaoDeCristo), titulo: 'Paixão de Cristo', tipo: 'Feriado Nacional' },
        { data_evento: toISO(easter), titulo: 'Páscoa', tipo: 'Feriado Nacional' },
        { data_evento: toISO(corpusChristi), titulo: 'Corpus Christi', tipo: 'Feriado Nacional' },
    ];

    FIXED_HOLIDAYS.forEach(h => {
        holidays.push({
            data_evento: `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
            titulo: h.name,
            tipo: h.type
        });
    });

    return holidays;
}
