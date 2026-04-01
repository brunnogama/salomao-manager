import { supabaseUrl, supabaseKey } from './supabase';

export interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'uuid' | 'jsonb' | 'timestamp' | 'other';
  isPrimaryKey: boolean;
  isRequired: boolean;
  isForeignKey: boolean;
  format?: string;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnSchema[];
}

let cachedSchema: any = null;

export const SchemaService = {
  /**
   * Obtém a documentação OpenAPI completa do Supabase via REST
   */
  async getOpenApiSpec() {
    if (cachedSchema) return cachedSchema;
    
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (!res.ok) throw new Error('Falha ao buscar schema');
      const data = await res.json();
      cachedSchema = data;
      return data;
    } catch (e) {
      console.error("Erro ao buscar documentação OpenAPI", e);
      return null;
    }
  },

  /**
   * Extrai o Schema estruturado para uma tabela específica
   */
  async getTableSchema(tableName: string): Promise<TableSchema | null> {
    const spec = await this.getOpenApiSpec();
    if (!spec || !spec.definitions || !spec.definitions[tableName]) {
      return null;
    }

    const tableDef = spec.definitions[tableName];
    const properties = tableDef.properties || {};
    const requiredProps = tableDef.required || [];
    
    // Tentativa de detectar PKs, normalmente 'id'
    const columns: ColumnSchema[] = [];

    for (const [colName, colDef] of Object.entries<any>(properties)) {
      let type: ColumnSchema['type'] = 'other';
      const colFormat = colDef.format || '';
      const colType = colDef.type || 'string';

      if (colFormat === 'uuid') {
        type = 'uuid';
      } else if (colFormat.includes('timestamp') || colFormat.includes('date')) {
        type = 'timestamp';
      } else if (colType === 'boolean') {
        type = 'boolean';
      } else if (colType === 'integer' || colType === 'number') {
        type = 'number';
      } else if (colType === 'array' || colType === 'object') {
        type = 'jsonb';
      } else {
        type = 'string';
      }

      const isRequired = requiredProps.includes(colName);
      const isPrimaryKey = colName === 'id'; // Aproximação segura no Supabase
      
      // Detecção simples de Foreign Key
      const isForeignKey = type === 'uuid' && colName.endsWith('_id');

      columns.push({
        name: colName,
        type,
        isPrimaryKey,
        isRequired,
        isForeignKey,
        format: colFormat
      });
    }

    return { tableName, columns };
  }
};
