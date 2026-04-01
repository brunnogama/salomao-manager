export const ensureArray = (val) => {
    if (!val) return [];
    
    if (Array.isArray(val) && val.length > 0 && val.every(item => typeof item === 'string' && item.length === 1)) {
        try {
            const joined = val.join('');
            const parsed = JSON.parse(joined);
            if (Array.isArray(parsed)) return parsed;
            // What if it parses to a string?
            if (typeof parsed === 'string') return [parsed];
            // What if it parses to a number?
            if (typeof parsed === 'number') return [String(parsed)];
        } catch { 
            // If it fails to parse (e.g. joined = "2.1")
            return [val.join('')];
        }
    }
    return val;
}

console.log('1', ensureArray(['"', '2', '.', '1', '"']));
console.log('2', ensureArray(['2', '.', '1']));
console.log('3', ensureArray(['[', '"', '2', '.', '1', '"', ']']));
