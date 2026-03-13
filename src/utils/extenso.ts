
const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const dezenas = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const onzeADezenove = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function converterGrupo(grupo: number): string {
    let s = "";
    const c = Math.floor(grupo / 100);
    const d = Math.floor((grupo % 100) / 10);
    const u = grupo % 10;

    if (grupo === 100) return "cem";

    if (c > 0) {
        s += centenas[c];
        if (d > 0 || u > 0) s += " e ";
    }

    if (d === 1) {
        s += onzeADezenove[u];
    } else {
        if (d > 0) {
            s += dezenas[d];
            if (u > 0) s += " e ";
        }
        if (u > 0 && d !== 1) {
            s += unidades[u];
        }
    }
    return s;
}

export function numeroPorExtenso(valor: number, genero: 'M' | 'F' = 'M'): string {
    if (valor === 0) return "zero";

    const strValor = valor.toString();
    const partes = strValor.split('.');
    let inteiro = parseInt(partes[0]);

    if (inteiro === 0) return "zero";

    const grupos = [];
    while (inteiro > 0) {
        grupos.push(inteiro % 1000);
        inteiro = Math.floor(inteiro / 1000);
    }

    const nomesGrupos = ["", "mil", "milhão", "bilhão", "trilhão"];
    const nomesGruposPlural = ["", "mil", "milhões", "bilhões", "trilhões"];

    let extenso = "";

    for (let i = grupos.length - 1; i >= 0; i--) {
        const grupo = grupos[i];
        if (grupo > 0) {
            if (extenso !== "") {
                if (i === 0 && (grupo < 100 || grupo % 100 === 0)) {
                    extenso += " e ";
                } else {
                    extenso += ", ";
                }
            }

            if (grupo === 1 && i === 1) { // 1000 => "mil" não "um mil"
                extenso += nomesGrupos[i];
            } else {
                extenso += converterGrupo(grupo);
                if (i > 0) {
                    extenso += " " + (grupo > 1 ? nomesGruposPlural[i] : nomesGrupos[i]);
                }
            }
        }
    }

    // Ajustes de gênero para "um/uma", "dois/duas" se necessário (embora para moeda geralmente seja masculino 'reais', 'centavos')
    // Para porcentagem: "um por cento" (M), "duas por cento" (?? usually numbers are masc in math context unless referring to noun)
    // Mantendo padrão masculino por enquanto, ajustar se precisar.

    return extenso;
}

export function moedaPorExtenso(valor: number): string {
    if (valor === 0) return "zero reais";

    const inteiro = Math.floor(valor);
    const centavos = Math.round((valor - inteiro) * 100);

    let ret = "";

    if (inteiro > 0) {
        ret += numeroPorExtenso(inteiro);
        ret += inteiro === 1 ? " real" : " reais";
    }

    if (centavos > 0) {
        if (inteiro > 0) ret += " e ";
        ret += numeroPorExtenso(centavos);
        ret += centavos === 1 ? " centavo" : " centavos";
    }

    return ret;
}

export function percentualPorExtenso(valor: number): string {
    // Ex: 10% -> dez por cento
    // Ex: 10,5% -> dez vírgula cinco por cento
    const str = valor.toString().replace('.', ',');
    const [intPart, decPart] = str.split(',');

    let ret = numeroPorExtenso(parseInt(intPart));

    if (decPart) {
        ret += " vírgula ";
        // Ler decimais dígito a dígito ou como número? 
        // Ex 0,5 -> zero vírgula cinco. 
        // Ex 10,25 -> dez vírgula vinte e cinco.
        // Vamos ler como número a parte decimal
        ret += numeroPorExtenso(parseInt(decPart));
    }

    ret += " por cento";
    return ret;
}

// --- ENGLISH CONVERSION FOR PROPOSALS ---

const unitsEn = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const tensEn = ["", "ten", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const teensEn = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const scalesEn = ["", "thousand", "million", "billion", "trillion"];

function convertGroupEn(group: number): string {
    let s = "";
    const h = Math.floor(group / 100);
    const t = Math.floor((group % 100) / 10);
    const u = group % 10;

    if (h > 0) {
        s += unitsEn[h] + " hundred";
        if (t > 0 || u > 0) s += " and ";
    }

    if (t === 1) {
        s += teensEn[u];
    } else {
        if (t > 0) {
            s += tensEn[t];
            if (u > 0) s += "-";
        }
        if (u > 0 && t !== 1) {
            s += unitsEn[u];
        }
    }
    return s;
}

export function numberToWordsEnglish(value: number): string {
    if (value === 0) return "zero";

    const strValue = value.toString();
    const parts = strValue.split('.');
    let integer = parseInt(parts[0]);

    if (integer === 0) return "zero";

    const groups = [];
    while (integer > 0) {
        groups.push(integer % 1000);
        integer = Math.floor(integer / 1000);
    }

    let words = "";

    for (let i = groups.length - 1; i >= 0; i--) {
        const group = groups[i];
        if (group > 0) {
            if (words !== "") {
                if (i === 0 && (group < 100)) words += " and ";
                else words += ", ";
            }
            words += convertGroupEn(group);
            if (i > 0) words += " " + scalesEn[i];
        }
    }

    return words;
}

export function currencyToWordsEnglish(value: number): string {
    if (value === 0) return "zero US dollars";

    const integer = Math.floor(value);
    const cents = Math.round((value - integer) * 100);

    let ret = "";

    if (integer > 0) {
        ret += numberToWordsEnglish(integer);
        ret += integer === 1 ? " US dollar" : " US dollars";
    }

    if (cents > 0) {
        if (integer > 0) ret += " and ";
        ret += numberToWordsEnglish(cents);
        ret += cents === 1 ? " cent" : " cents";
    }

    return ret;
}
