const fs = require('fs');
const filepath = 'c:/Users/MárcioGama/OneDrive - SALOMAO, KAIUCA & ABRAHAO SOCIEDADE DE ADVOGADOS/Área de Trabalho/Projetos/salomao-manager/src/components/collaborators/pages/Colaboradores.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Define replacements that are strictly targeting UI text (quotes or tags)
const replacements = [
  { search: /\'Gestão de Colaboradores\'/g, replace: "'Gestão de Integrantes'" },
  { search: /\"Gestão de Colaboradores\"/g, replace: '"Gestão de Integrantes"' },
  { search: /\'Novo Colaborador\'/g, replace: "'Novo Integrante'" },
  { search: /\"Novo Colaborador\"/g, replace: '"Novo Integrante"' },
  { search: /\'Colaborador\'/g, replace: "'Integrante'" },
  { search: /\"Colaborador\"/g, replace: '"Integrante"' },
  { search: />Colaborador</g, replace: '>Integrante<' },
  { search: /\'Colaborador\(a\)\'/g, replace: "'Integrante(a)'" },
  { search: />Colaborador\(a\)</g, replace: '>Integrante(a)<' },
  { search: /\'Colaboradores\'/g, replace: "'Integrantes'" },
  { search: /\"Colaboradores\"/g, replace: '"Integrantes"' },
  { search: />Colaboradores</g, replace: '>Integrantes<' },
  { search: /colaboradores selecionados/gi, replace: 'integrantes selecionados' },
  { search: /colaborador selecionado/gi, replace: 'integrante selecionado' },
  { search: /Selecione o\(a\) colaborador\(a\)/g, replace: 'Selecione o(a) integrante' },
  { search: /Selecione o colaborador/gi, replace: 'Selecione o integrante' },
  { search: /Excluir Colaborador/g, replace: 'Excluir Integrante' },
  { search: /\'Colaboradores e Estagiários\'/g, replace: "'Integrantes e Estagiários'" },
  { search: />\s*Colaboradores/g, replace: '>Integrantes' }
];

let changedCount = 0;
replacements.forEach(({ search, replace }) => {
  const matches = content.match(search);
  if (matches) {
     changedCount += matches.length;
     content = content.replace(search, replace);
  }
});

fs.writeFileSync(filepath, content, 'utf8');
console.log('Done! Replaced ' + changedCount + ' instances.');
