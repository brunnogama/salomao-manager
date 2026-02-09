const fs = require('fs');
const path = require('path');

const controladoriaPat = path.join(__dirname, 'src', 'components', 'controladoria');

function fixImports(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  if (filePath.includes('node_modules')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix Supabase imports
  const supabasePatterns = [
    { from: /from ['"]\.\/lib\/supabase['"]/g, to: "from '../../../lib/supabase'" },
    { from: /from ['"]\.\.\/lib\/supabase['"]/g, to: "from '../../../lib/supabase'" },
    { from: /from ['"]\.\.\/\.\.\/lib\/supabase['"]/g, to: "from '../../../lib/supabase'" },
    { from: /from ['"]\.\.\/\.\.\/\.\.\/lib\/supabase['"]/g, to: "from '../../../lib/supabase'" }
  ];
  
  // Fix Types imports
  const typePatterns = [
    { from: /from ['"]\.\/types['"]/g, to: "from '../../../types/controladoria'" },
    { from: /from ['"]\.\.\/types['"]/g, to: "from '../../../types/controladoria'" },
    { from: /from ['"]\.\.\/\.\.\/types['"]/g, to: "from '../../../types/controladoria'" }
  ];
  
  [...supabasePatterns, ...typePatterns].forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Corrigido: ${path.relative(process.cwd(), filePath)}`);
  }
}

function walkDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.git') {
          walkDir(filePath);
        }
      } else {
        fixImports(filePath);
      }
    });
  } catch (error) {
    console.error(`❌ Erro ao processar ${dir}:`, error.message);
  }
}

console.log('🔧 Corrigindo imports da Controladoria...\n');
walkDir(controladoriaPat);
console.log('\n✅ Correção concluída!');