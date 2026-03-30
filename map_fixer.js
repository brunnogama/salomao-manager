const fs = require('fs');

const inFile = 'tmp_map.tsx';
const outFile = 'src/components/collaborators/components/RHMapaAndar31.tsx';

let oldMap = fs.readFileSync(inFile, 'utf16le');

// Extrair SEATS_31_ANDAR
const seatsRegex = /const SEATS_31_ANDAR: FloorSeat\[\] = \[([\s\S]*?)\];/;
const matchSeats = oldMap.match(seatsRegex);
const oldSeatsContent = matchSeats[1];

// Extrair CSS Walls (from <div className="absolute top-[35px] left-[15px] ...)
const cssRegex = /\{Array\.from\(\{length: 5\}\)\.map\(\(_, i\) => \([\s\S]*?\{SEATS_31_ANDAR\.map\(seat => \{/m;
const matchCss = oldMap.match(cssRegex);
let oldCssWalls = matchCss[0].replace('{SEATS_31_ANDAR.map(seat => {', '');

// Scale logic: We'll wrap the inner elements in a scale container instead of mutating all 200 hardcoded numbers!
// The user says: 100% igual exceto o vazio central menor.
// To make the gap on the right smaller without breaking CSS logic: we can literally wrap the RIGHT side in a div with `transform: translateX(-300px)`!!
// And the LEFT side in another wrapper!

// Actually, rewriting the JS to mutate the numbers is cleaner.
function subtractGap(str) {
    // We will find all `left: 1???` and `left-[1???px]` and subtract 300 from the number.
    // For CSS: left-\[(\d+)px\] 
    str = str.replace(/left-\[(\d+)px\]/g, (match, val) => {
        let n = parseInt(val, 10);
        if (n > 900) return `left-[${n - 350}px]`;
        return match;
    });
    // For JS left: (\d+)
    str = str.replace(/left:\s*(\d+)/g, (match, val) => {
        let n = parseInt(val, 10);
        if (n > 900) return `left: ${n - 350}`;
        return match;
    });
    // Also fixing widths spanning across the gap (like Central Area lines)
    // w-[750px] or w-[810px] etc. Since the gap is in the middle, and we move the right side leftwards, the total span is smaller.
    // The central area width was W=750 and W=810 etc. We'll manually adjust them later if needed, but wait! The "empty middle" means the whole right column is moved. We don't shrink the actual desks, just the position.
    str = str.replace(/w-\[750px\]/g, 'w-[750px]'); // left central area line? actually left one is X=165 to 915. Right one is 950 to 1760. The gap is between 915 and 950? No, the gap is inside the central area itself. 
    return str;
}

const newSeats = subtractGap(oldSeatsContent);
const newCss = subtractGap(oldCssWalls);

fs.writeFileSync('parsed_seats.txt', newSeats);
fs.writeFileSync('parsed_css.txt', newCss);
