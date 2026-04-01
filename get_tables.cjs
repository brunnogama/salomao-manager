const fs = require('fs');
const path = require('path');

const tables = [
  'tasks', 'config_magistrados', 'magistrados', 'aeronave_tipos', 'aeronave_fornecedores', 'usuarios_permitidos', 'aeronave_docs_fiscais', 'profiles', 'collaborator_role_history', 'aeronave_frota', 'eventos', 'contract_processes', 'locations', 'contract_installments', 'shopping_list_items', 'candidato_ged', 'tipos_brinde', 'certificate_names', 'presenca_portaria', 'user_profiles', 'roles', 'opcoes_tipos', 'opcoes_lideres', 'rh_postos_mapa', 'secretaria_familia', 'ged_colaboradores', 'familia_config_opcoes', 'processos', 'familia_salomao_dados', 'perfil_tags', 'ged_categories', 'process_varas', 'secretaria_despesas', 'secretaria_calendario', 'familia_salomao_despesas', 'familia_opcoes_menu', 'financeiro_aeronave', 'aeronave_lancamentos', 'finance_clientes', 'ged_documentos', 'finance_faturas', 'rh_mapa_elementos', 'client_contacts', 'oab_number', 'aeronave_missoes', 'user_kanban_settings', 'financeiro_aeronave_pagamentos', 'financeiro_oab', 'marcacoes_ponto', 'operational_fornecedores', 'education_institutions', 'clients', 'education_courses', 'financial_installments', 'contract_documents', 'education_post_courses', 'sucumbencias', 'rateios', 'certificates', 'certificate_agencies', 'collaborator_absences', 'collaborator_warnings', 'termination_reasons', 'vw_vencimentos_oab_6meses', 'atuacoes', 'operational_stock_ledger', 'bolsa_estagio_rules', 'rh_actions', 'collaborators', 'analysts', 'authors', 'comarcas', 'contract_statuses', 'contract_timeline', 'courts', 'magistrates', 'probono_sources', 'audit_logs', 'opponents', 'process_classes', 'collaborator_education_history', 'process_justice_types', 'process_positions', 'process_subjects', 'operational_assets', 'vaga_candidatos', 'vagas', 'office_locations', 'familia_salomao_demandas', 'rh_postos', 'teams', 'hiring_reasons', 'termination_initiatives', 'termination_types', 'partners', 'logs', 'candidato_historico', 'rh_export_templates', 'operational_items', 'candidato_experiencias'
];

const results = {};
for (const table of tables) {
  results[table] = new Set();
}

function walk(dir) {
  let list = fs.readdirSync(dir);
  for (let file of list) {
    file = path.join(dir, file);
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      walk(file);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        let content = fs.readFileSync(file, 'utf-8');
        for (const table of tables) {
          if (content.includes(table)) {
            // Also enforce word boundary to avoid partial matches
            const regex = new RegExp(`\\b${table}\\b`);
            if (regex.test(content)) {
               results[table].add(file);
            }
          }
        }
      }
    }
  }
}

walk('./src');

const output = {};
for (const table in results) {
  output[table] = Array.from(results[table]);
}

fs.writeFileSync('table_mapping.json', JSON.stringify(output, null, 2));
console.log('Mapping complete.');
