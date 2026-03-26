import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // We do NOT want to replace:
    // - export function Colaboradores
    // - import { Colaboradores }
    // - export * from './Colaboradores'
    // - /Colaboradores (paths)
    // - className="... colaboradores ..."
    // - const colaboradores = ...
    // - useColaboradores
    // - interface Colaborador
    // - type Colaborador
    // - export * from './colaborador'

    // Patterns for UI text:
    const replacements = [
        { from: /([>"}])(Colaboradores)([<"{])/g, to: '$1Integrantes$3' },
        { from: /([>"}])(Colaborador)([<"{])/g, to: '$1Integrante$3' },
        { from: /([ \t])(Colaboradores)([ \t\n<:,])/g, to: '$1Integrantes$3' },
        { from: /([ \t])(Colaborador)([ \t\n<:,])/g, to: '$1Integrante$3' },
        { from: /'Colaboradores'/g, to: "'Integrantes'" },
        { from: /'Colaborador'/g, to: "'Integrante'" },
        { from: /"Colaboradores"/g, to: '"Integrantes"' },
        { from: /"Colaborador"/g, to: '"Integrante"' },
        { from: /`Colaboradores`/g, to: '`Integrantes`' },
        { from: /`Colaborador`/g, to: '`Integrante`' },
        { from: /Novo Colaborador/g, to: 'Novo Integrante' },
        { from: /Novo colaborador/g, to: 'Novo integrante' },
        { from: /Editar Colaborador/g, to: 'Editando Integrante' },
        { from: /Nenhum colaborador/g, to: 'Nenhum integrante' },
        { from: /nenhum colaborador/g, to: 'nenhum integrante' },
        { from: /o colaborador/g, to: 'o integrante' },
        { from: /O colaborador/g, to: 'O integrante' },
        { from: /os colaboradores/g, to: 'os integrantes' },
        { from: /Os colaboradores/g, to: 'Os integrantes' },
        { from: /do colaborador/g, to: 'do integrante' },
        { from: /Do colaborador/g, to: 'Do integrante' },
        { from: /dos colaboradores/g, to: 'dos integrantes' },
        { from: /Dos colaboradores/g, to: 'Dos integrantes' },
        { from: /ao colaborador/g, to: 'ao integrante' },
        { from: /aos colaboradores/g, to: 'aos integrantes' },
        { from: /Nenhum Colaborador/g, to: 'Nenhum Integrante' },
        { from: /O Colaborador/g, to: 'O Integrante' },
        { from: /Os Colaboradores/g, to: 'Os Integrantes' },
        { from: /Do Colaborador/g, to: 'Do Integrante' },
        { from: /Dos Colaboradores/g, to: 'Dos Integrantes' },
        { from: /Ao Colaborador/g, to: 'Ao Integrante' },
        { from: /Aos Colaboradores/g, to: 'Aos Integrantes' },
        { from: />colaboradores</g, to: '>integrantes<' },
        { from: />colaborador</g, to: '>integrante<' }
    ];

    // Some specific contexts like "Colaboradores" inside a comment or UI heading
    replacements.forEach(({from, to}) => {
        content = content.replace(from, to);
    });

    // Special fix for "export function Integrantes..." accidentally matched by spaces
    // we only matched spaces `([ \t])(Colaboradores)`, so `function Colaboradores` becomes `function Integrantes`. Let's revert code keywords.
    content = content.replace(/function Integrantes\b/g, 'function Colaboradores');
    content = content.replace(/function Integrante\b/g, 'function Colaborador');
    content = content.replace(/interface Integrantes\b/g, 'interface Colaboradores');
    content = content.replace(/interface Integrante\b/g, 'interface Colaborador');
    content = content.replace(/type Integrantes\b/g, 'type Colaboradores');
    content = content.replace(/type Integrante\b/g, 'type Colaborador');
    content = content.replace(/import \{ Integrantes \}/g, 'import { Colaboradores }');
    content = content.replace(/import \{ Integrante \}/g, 'import { Colaborador }');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log('Modified:', file);
    }
});
console.log(`Finished replacing in ${changedFiles} files.`);
