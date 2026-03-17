import { useState, useEffect, useRef, Fragment } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, Transition } from '@headlessui/react';
import { 
    Award, 
    Calendar,
    Loader2,
    Upload,
    FileSpreadsheet,
    Search,
    FileText,
    Trash2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Filter,
    X,
    Wallet,
    Hourglass
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { SearchableSelect } from '../../crm/SearchableSelect';

interface LegalOneRow {
    Tipo?: string;
    'Responsável principal'?: string;
    Pasta?: string;
    'Número de CNJ'?: string;
    'Posição do cliente principal'?: string;
    'Data da distribuição'?: string;
    Status?: string;
    UF?: string;
    'Data Andamento'?: string;
    'Tipo Andamento'?: string;
    'Subtipo Andamentos'?: string;
    Descrição?: string;
    [key: string]: any; // Allow other columns
}

interface FiltragemAndamento {
    id: string;
    dataAndamento: string;
    descricao: string;
    tipoAndamento: string;
    subtipoAndamento: string;
}

interface FilteredSucumbencia {
    id: string;
    responsavel: string;
    cnj: string;
    uf: string;
    cliente?: string;
    posicao_cliente?: string;
    contrario?: string;
    status?: 'potencial' | 'prescrito' | 'descartado' | 'recebido' | 'verificado';
    andamentos: FiltragemAndamento[];
}

const HighlightText = ({ text, snippet = false }: { text: string; snippet?: boolean }) => {
    if (!text) return null;
    
    let displayText = text;
    
    // Se for modo snippet, tenta centralizar o texto em volta da palavra-chave primária
    if (snippet) {
        const primaryRegex = /(honorários de sucumbência|honorários advocatícios|honorarios de sucumbencia|honorarios advocaticios|sucumbência|sucumbencia)/i;
        const match = text.match(primaryRegex);
        if (match && match.index !== undefined) {
            const contextRadius = 80; // caracteres antes e depois
            const start = Math.max(0, match.index - contextRadius);
            const end = Math.min(text.length, match.index + match[0].length + contextRadius);
            
            displayText = (start > 0 ? '... ' : '') + 
                          text.substring(start, end) + 
                          (end < text.length ? ' ...' : '');
        } else {
            // Se por acaso não achar a primária, pega o começo apenas
            displayText = text.length > 150 ? text.substring(0, 150) + '...' : text;
        }
    }

    const keywords = [
        'honorários de sucumbência', 'honorários advocatícios', 'honorarios de sucumbencia', 'honorarios advocaticios', 'sucumbência', 'sucumbencia',
        'condenar', 'condeno', 'condenou', 'condenação', 'condenacao', 'sentença', 'sentenca', 'pagamento', 'sucumbente', 'parte contrária', 'parte contraria', 'vencido'
    ];
    
    // Sort by length so longer phrases match first
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
    const regex = new RegExp(`(${sortedKeywords.join('|')})`, 'gi');
    
    const parts = displayText.split(regex);
    
    return (
        <>
            {parts.map((part, i) => {
                const isMatch = sortedKeywords.some(kw => kw.toLowerCase() === part.toLowerCase());
                return isMatch ? (
                    <mark key={i} className="bg-yellow-200 text-yellow-900 font-bold px-1 rounded mx-0.5">{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                );
            })}
        </>
    );
};

// Helper function to map full state names to UF initials
const getUfInitials = (stateName: string): string => {
    if (!stateName) return '-';
    const normalizedMap: { [key: string]: string } = {
        'acre': 'AC', 'alagoas': 'AL', 'amapá': 'AP', 'amapa': 'AP', 'amazonas': 'AM',
        'bahia': 'BA', 'ceará': 'CE', 'ceara': 'CE', 'distrito federal': 'DF',
        'espírito santo': 'ES', 'espirito santo': 'ES', 'goiás': 'GO', 'goias': 'GO',
        'maranhão': 'MA', 'maranhao': 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
        'minas gerais': 'MG', 'pará': 'PA', 'para': 'PA', 'paraíba': 'PB', 'paraiba': 'PB',
        'paraná': 'PR', 'parana': 'PR', 'pernambuco': 'PE', 'piauí': 'PI', 'piaui': 'PI',
        'rio de janeiro': 'RJ', 'rio grande do norte': 'RN', 'rio grande do sul': 'RS',
        'rondônia': 'RO', 'rondonia': 'RO', 'roraima': 'RR', 'santa catarina': 'SC',
        'são paulo': 'SP', 'sao paulo': 'SP', 'sergipe': 'SE', 'tocantins': 'TO'
    };
    
    const cleanName = stateName.trim().toLowerCase();
    
    if (normalizedMap[cleanName]) return normalizedMap[cleanName];
    
    // Fallback: se já for uma sigla ou algo que não conhecemos, pegamos as 2 primeiras letras do que vier
    return stateName.trim().substring(0, 2).toUpperCase();
};

export function Sucumbencias() {
    const [loading, setLoading] = useState(false); // Initially false, only true when parsing
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Data states - Initialize empty, IndexedDB will fill them
    const [importedData, setImportedData] = useState<FilteredSucumbencia[]>([]);
    const [hasImported, setHasImported] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterResponsavel, setFilterResponsavel] = useState('Todos');
    const [selectedItem, setSelectedItem] = useState<FilteredSucumbencia | null>(null);
    const [activeTab, setActiveTab] = useState<'potenciais' | 'prescritos' | 'descartados' | 'recebidos'>('potenciais');
    const [activeModalTab, setActiveModalTab] = useState(0);

    const fetchSucumbencias = async () => {
        try {
            setLoading(true);
            
            let allData: any[] = [];
            let hasMore = true;
            let page = 0;
            const pageSize = 1000; // Limite padrão seguro da API do Supabase PostgREST
            
            while (hasMore) {
                const { data, error } = await supabase
                    .from('sucumbencias')
                    .select('*')
                    .range(page * pageSize, (page + 1) * pageSize - 1);
                    
                if (error) throw error;
                
                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    if (data.length < pageSize) {
                        hasMore = false; // Se a página não veio cheia, acabou os dados do banco
                    } else {
                        page++;
                    }
                } else {
                    hasMore = false; // Vazio, acabou
                }
            }
            
            const groupedMap = new Map<string, FilteredSucumbencia>();
            
            allData.forEach((row: any) => {
                if (!groupedMap.has(row.processo_cnj)) {
                    groupedMap.set(row.processo_cnj, {
                        id: `db-${row.processo_cnj}`,
                        responsavel: row.responsavel || 'Não Informado',
                        cnj: row.processo_cnj,
                        uf: row.uf || '-',
                        cliente: row.cliente || '',
                        posicao_cliente: row.posicao_cliente || '',
                        contrario: row.contrario || '',
                        status: row.status as any,
                        andamentos: []
                    });
                }
                groupedMap.get(row.processo_cnj)!.andamentos.push({
                    id: row.id,
                    dataAndamento: row.data_andamento || '-',
                    descricao: row.descricao || '',
                    tipoAndamento: row.tipo_andamento || '',
                    subtipoAndamento: row.subtipo_andamento || '',
                });
            });
            
            const results = Array.from(groupedMap.values());
            setImportedData(results);
            setHasImported(results.length > 0);
        } catch (error) {
            console.error('Error fetching sucumbencias:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSucumbencias();
    }, []);

    // State that controls "Clear Data" confirmation modal
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    // Filtros de Data. Default: 1 de Janeiro deste ano até hoje.
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-01-01`;
    });

    const [endDate, setEndDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    useEffect(() => {
        // Simulando carregamento inicial
        const timer = setTimeout(() => {
            setLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, [startDate, endDate]);

    // --- Supabase Actions ---
    const handleAction = async (item: FilteredSucumbencia, status: 'verificado' | 'descartado' | 'recebido' | 'prescrito') => {
        try {
            // Optimistically update the status
            setImportedData(prev => prev.map(d => d.id === item.id ? { ...d, status } : d));

            // Update in Supabase
            const { error } = await supabase
                .from('sucumbencias')
                .update({ status })
                .eq('processo_cnj', item.cnj);

            if (error) {
                console.warn('Supabase Update Warning:', error.message);
                alert('Aviso: Erro ao salvar alteração no banco.');
                fetchSucumbencias(); // Revert on failure
            }
        } catch (error) {
            console.error('Action error:', error);
            alert('Erro ao atualizar no banco de dados.');
        }
    };

    // --- Import and Parsing Logic ---
    const processFile = async (file: File) => {
        setLoading(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Assume the main data is on the first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json<LegalOneRow>(worksheet, { defval: '' });
            
            // Map for aggregation by CNJ
            const groupedMap = new Map<string, FilteredSucumbencia>();
            
            // Definição de palavras-chave baseadas na orientação "A sentença deve explicitamente condenar a parte contrária ao pagamento de honorários..."
            const primaryKeywords = ['honorários de sucumbência', 'honorários advocatícios', 'honorarios de sucumbencia', 'honorarios advocaticios', 'sucumbência', 'sucumbencia'];
            
            // Fatores de peso (para refinar e evitar falsos positivos)
            // Se tiver essas palavras, é muito provável que seja uma condenação real
            const contextKeywords = ['condenar', 'condeno', 'condenou', 'condenação', 'condenacao', 'sentença', 'sentenca', 'pagamento', 'sucumbente', 'parte contrária', 'parte contraria', 'vencido'];
            
            const excludeKeywords = ['orientação', 'orientações gerais'];

            // --- Deduplication Strategy ---
            // Extract CNJs directly from the raw data first to bulk-query
            const rawCnjs = Array.from(new Set(jsonData.map(r => String(r['Número de CNJ'] || r['Pasta'] || '').trim()).filter(Boolean)));
            
            let existingHashes = new Set<string>();
            try {
                if (rawCnjs.length > 0) {
                    // Chunk the array into sizes of 50 to prevent "URL Too Long" / QuotaExceeded errors
                    const chunkSize = 50;
                    for (let i = 0; i < rawCnjs.length; i += chunkSize) {
                        const chunk = rawCnjs.slice(i, i + chunkSize);
                        const { data: existingRecords, error } = await supabase
                            .from('sucumbencias')
                            .select('hash_id')
                            .in('processo_cnj', chunk);

                        if (!error && existingRecords) {
                            existingRecords.forEach(r => {
                                if (r.hash_id) existingHashes.add(r.hash_id);
                            });
                        }
                    }
                }
            } catch (err) {
                console.warn("Deduplication error:", err);
            }

            // Agora realiza a filtragem
            jsonData.forEach((row, index) => {
                const fieldDataAndamento = String(row['Data Andamento'] || '');
                const fieldDescricao = String(row['Descrição'] || '');
                const fieldTipo = String(row['Tipo Andamento'] || '');
                const fieldSubtipo = String(row['Subtipo Andamentos'] || '');

                // Split them by newline, typical of LegalOne grouped cells
                const dates = fieldDataAndamento.split(/\r?\n/);
                const descricoes = fieldDescricao.split(/\r?\n/);
                const tipos = fieldTipo.split(/\r?\n/);
                const subtipos = fieldSubtipo.split(/\r?\n/);

                const maxLen = Math.max(dates.length, descricoes.length, tipos.length, subtipos.length);

                for (let i = 0; i < maxLen; i++) {
                    const dataAnd = (dates[i] || '').trim().replace(/;$/, '');
                    const desc = (descricoes[i] || '').trim().replace(/;$/, '');
                    const tipo = (tipos[i] || '').trim().replace(/;$/, '');
                    const subtipo = (subtipos[i] || '').trim().replace(/;$/, '');

                    if (!desc && !tipo && !subtipo) continue;

                    // Construct search strings
                    const searchString = `${desc} ${tipo} ${subtipo}`.toLowerCase();
                    const hasExclude = excludeKeywords.some(kw => searchString.includes(kw));
                    
                    if (hasExclude) continue;

                    // 1. Testa se tem a palavra-chave primária
                    const hasPrimary = primaryKeywords.some(kw => searchString.includes(kw));

                    // Se NÃO tiver a palavra-chave primária (honorários/sucumbência), descarta na hora
                    if (!hasPrimary) {
                        continue;
                    }

                    let isMatch = false; // Já tem a palavra primária, então a princípio é match

                    if (hasPrimary) {
                        if (searchString.length < 100) {
                            // É um título curto, se tem a palavra chave de sucumbência, aceita.
                            isMatch = true;
                        } else {
                            // É um texto longo (ex: publicação). Verifica se possui contexto de condenação.
                            const hasContext = contextKeywords.some(kw => searchString.includes(kw));
                            
                            // Exige o contexto para textos longos, garantindo que seja uma condenação real
                            // e não apenas uma citação genérica a honorários.
                            if (hasContext) {
                                isMatch = true; 
                            }
                        }
                    }

                    if (isMatch) {
                        // Check deduplication
                        const baseCnj = row['Número de CNJ'] || row['Pasta'];
                        const cnjLabel = baseCnj ? String(baseCnj).trim() : `Sem Número (Linha ${index})`;
                        
                        // Cria um hash mais preciso com data e tipo para não aglutinar andamentos vazios do mesmo processo
                        const dataAndClean = (dataAnd || '').substring(0, 10);
                        const tipoClean = (tipo || '').substring(0, 20).replace(/\s/g, '').toLowerCase();
                        const descSubstring = desc.substring(0, 50).replace(/\s/g, '').toLowerCase();
                        const hash_id = `${cnjLabel}-${dataAndClean}-${tipoClean}-${descSubstring}`.substring(0, 254);

                        if (existingHashes.has(hash_id)) continue; // Already reviewed!

                        // NO TRUNCATION to allow full reading on click. The stricter filter prevents QuotaExceeded by resulting in very few matches.
                        const finalDesc = desc || fieldDescricao;

                        if (!groupedMap.has(cnjLabel)) {
                            groupedMap.set(cnjLabel, {
                                id: `import-cnj-${index}`,
                                responsavel: row['Responsável principal'] || 'Não Informado',
                                cnj: cnjLabel,
                                uf: row['UF'] || '-',
                                cliente: String(row['Cliente principal'] || '').substring(0, 254),
                                posicao_cliente: String(row['Posição do cliente principal'] || '').substring(0, 254),
                                contrario: String(row['Contrário(s) principal(is)'] || '').substring(0, 254),
                                status: 'potencial',
                                andamentos: []
                            });
                        }

                        groupedMap.get(cnjLabel)!.andamentos.push({
                            id: `and-${index}-${i}`,
                            dataAndamento: dataAnd || '-',
                            descricao: finalDesc,
                            tipoAndamento: tipo || fieldTipo,
                            subtipoAndamento: subtipo || fieldSubtipo,
                        });
                    }
                }
            });

            const filteredResults = Array.from(groupedMap.values());

            if (filteredResults.length === 0) {
                alert('Todos os andamentos de sucumbência desta planilha já foram verificados ou descartados anteriormente (ou nenhum foi encontrado).');
                setLoading(false);
                return;
            }

            // Usaremos a existingHashes (do bloco de cima da varredura principal)
            
            // Generate payload filtering out existing hashes
            const rawPayload = filteredResults.flatMap(item => 
                item.andamentos.map(and => ({
                    processo_cnj: String(item.cnj || 'Sem Número').substring(0, 254),
                    responsavel: String(item.responsavel || 'Não Informado').substring(0, 254),
                    uf: getUfInitials(item.uf),
                    cliente: item.cliente,
                    posicao_cliente: item.posicao_cliente,
                    contrario: item.contrario,
                    data_andamento: String(and.dataAndamento || '-').substring(0, 49),
                    tipo_andamento: String(and.tipoAndamento || '').substring(0, 254),
                    subtipo_andamento: String(and.subtipoAndamento || '').substring(0, 254),
                    descricao: and.descricao || '',
                    status: 'potencial',
                    hash_id: `${item.cnj}-${String(and.dataAndamento || '').substring(0, 10)}-${String(and.tipoAndamento || '').substring(0, 20).replace(/\s/g, '').toLowerCase()}-${(and.descricao || '').substring(0, 50).replace(/\s/g, '').toLowerCase()}`.substring(0, 254)
                }))
            ).filter(item => !existingHashes.has(item.hash_id));

            // Deduplicate within the payload itself to prevent 409/400 conflicts
            const uniquePayloadMap = new Map();
            rawPayload.forEach(item => {
                if (!uniquePayloadMap.has(item.hash_id)) {
                    uniquePayloadMap.set(item.hash_id, item);
                }
            });
            const payload = Array.from(uniquePayloadMap.values());

            if (payload.length > 0) {
                // Use chunking for insert
                const chunkSize = 100;
                let hasError = false;
                for (let i = 0; i < payload.length; i += chunkSize) {
                    const chunk = payload.slice(i, i + chunkSize);
                    const { error: insertError } = await supabase.from('sucumbencias').insert(chunk);
                    if (insertError) {
                        console.error('SUPABASE INSERT ERROR DETAILS:', insertError);
                        alert(`Erro do Banco de Dados: ${insertError.message}\nDetalhes: ${insertError.details || insertError.hint || 'Veja o console (F12) para info completa.'}`);
                        hasError = true;
                        break; 
                    }
                }
                if(hasError) {
                   setLoading(false);
                   return;
                }
            }

            await fetchSucumbencias();
        } catch (error) {
            console.error('Error parsing file:', error);
            alert('Erro ao processar o arquivo. Verifique se é uma planilha válida do LegalOne.');
            setLoading(false);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processFile(file);
        }
        // Reset input so the same file can be uploaded again if needed
        if (event.target) {
            event.target.value = '';
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.xls'))) {
            processFile(file);
        } else {
            alert('Por favor, envie apenas arquivos do tipo Excel (.xlsx, .xls) ou CSV.');
        }
    };

    // Filtered data for display based on tab
    const tabFilteredData = importedData.filter(item => {
        const itemStatus = item.status || 'potencial';
        if (activeTab === 'potenciais') return itemStatus === 'potencial';
        if (activeTab === 'prescritos') return itemStatus === 'prescrito';
        if (activeTab === 'descartados') return itemStatus === 'descartado';
        if (activeTab === 'recebidos') return itemStatus === 'recebido';
        return false;
    });

    const displayedData = tabFilteredData.filter(item => {
        const matchSearch = item.cnj.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.andamentos.some(and => and.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchResp = filterResponsavel === 'Todos' || item.responsavel === filterResponsavel;

        return matchSearch && matchResp;
    });

    // Unique responsaveis list for dropdown from current tab explicitly (or all imported)
    const uniqueResponsaveis = Array.from(new Set(importedData.map(d => d.responsavel))).sort();

    const handleMarkAsPrescrito = (item: FilteredSucumbencia) => {
        handleAction(item, 'prescrito');
        if (selectedItem?.id === item.id) {
            setSelectedItem(null);
        }
    };

    const handleActionFromModal = (item: FilteredSucumbencia, status: 'verificado' | 'descartado' | 'recebido') => {
        handleAction(item, status);
        setSelectedItem(null);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 space-y-4 animate-in fade-in duration-500">
            {/* Input de Arquivo Global (Oculto) mantido na raiz do dom para que os botões de upload sempre tenham acesso ao ref, independente do estado da tela */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
            />

            {/* Header com Título, Abas e Botões de Ação Principais */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="rounded-xl bg-[#1e3a8a] p-2 sm:p-3 shadow-sm shrink-0">
                        <Award className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Honorários de Sucumbência</h1>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Gestão e acompanhamento de valores sucumbenciais</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto relative justify-between lg:justify-end">
                    {/* Tabs no Header Superior */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('potenciais')}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center gap-2 ${activeTab === 'potenciais' ? 'bg-white shadow-sm text-[#1e3a8a]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="hidden sm:inline">Potenciais</span>
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[9px]">{importedData.filter(d => (d.status || 'potencial') === 'potencial').length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('prescritos')}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center gap-2 ${activeTab === 'prescritos' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="hidden sm:inline">Prescritos</span>
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[9px]">{importedData.filter(d => d.status === 'prescrito').length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('descartados')}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center gap-2 ${activeTab === 'descartados' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="hidden sm:inline">Descartados</span>
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[9px]">{importedData.filter(d => d.status === 'descartado').length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('recebidos')}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center gap-2 ${activeTab === 'recebidos' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="hidden sm:inline">Recebidos</span>
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[9px]">{importedData.filter(d => d.status === 'recebido').length}</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsClearModalOpen(true)}
                            className="w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 text-[#1e3a8a] rounded-xl flex items-center justify-center transition-all shadow-sm"
                            title="Limpar Base"
                        >
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 text-white rounded-xl flex items-center justify-center transition-all shadow-sm shadow-emerald-500/20"
                            title="Importar Relatório LegalOne"
                        >
                            <Upload className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Barra de Filtros Inferior Branca parecida com a de Colaboradores */}
            {hasImported && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    
                    {/* Card de Quantidade (Pequeno) */}
                    <div className="flex items-center gap-4 bg-[#f8fafc] px-4 py-2 rounded-lg border border-gray-100 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-blue-100/50 rounded-md">
                                <Award className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest opacity-60">Processos Ativos</span>
                                <span className="text-sm font-bold text-[#0a192f] leading-tight">{tabFilteredData.length}</span>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest opacity-60">Andamentos</span>
                            <span className="text-sm font-bold text-[#0a192f] leading-tight flex items-baseline gap-1">
                                {tabFilteredData.reduce((acc, curr) => acc + curr.andamentos.length, 0)}
                                <span className="text-[9px] font-normal text-gray-400">eventos agrupados</span>
                            </span>
                        </div>
                    </div>

                    {/* Barra de Pesquisa */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Buscar processo, palavra ou nome..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-300 focus:bg-white transition-all focus:ring-2 focus:ring-blue-100"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 bg-gray-200 text-gray-500 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Filtro de Período (Duração de Andamentos) */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 shrink-0">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-xs font-medium border-none outline-none text-gray-600 bg-transparent cursor-pointer"
                        />
                        <span className="text-gray-300 text-xs">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-xs font-medium border-none outline-none text-gray-600 bg-transparent cursor-pointer"
                        />
                    </div>

                    {/* Filtro de Responsável */}
                    <div className="relative shrink-0 w-full sm:w-64 z-20">
                        <SearchableSelect 
                            value={filterResponsavel === 'Todos' ? '' : filterResponsavel}
                            onChange={(val) => setFilterResponsavel(val || 'Todos')}
                            options={uniqueResponsaveis.map(r => ({ value: r, label: r, name: r }))}
                            placeholder="Todos os Responsáveis"
                            icon={<Filter className="w-4 h-4 text-gray-400" />}
                            className="[&>div]:py-2 [&>div]:bg-gray-50 [&>div]:border-gray-100 [&>div]:shadow-none"
                            hideSearch={uniqueResponsaveis.length <= 10}
                        />
                    </div>
                    
                </div>
            )}

            {loading ? (
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando dados de sucumbência...</p>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Area principal de conteúdo */}
                    <div className="grid grid-cols-1 gap-6 items-start">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
                            
                            {/* Import State */}
                            {!hasImported ? (
                                <div 
                                    className={`flex-1 flex flex-col items-center justify-center p-12 text-center transition-colors rounded-2xl border-2 border-dashed m-4 ${isDragging ? 'border-[#1e3a8a] bg-blue-50/50' : 'border-gray-200 bg-gray-50/30 hover:border-blue-300'}`}
                                    onDragOver={onDragOver}
                                    onDragLeave={onDragLeave}
                                    onDrop={onDrop}
                                >
                                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                                        <FileSpreadsheet className="w-10 h-10" />
                                    </div>
                                    <h4 className="text-xl font-black text-[#0a192f] mb-3">Importar Relatório LegalOne</h4>
                                    <p className="text-sm text-gray-500 max-w-md mb-8 leading-relaxed">
                                        Para identificar as sucumbências a receber, envie a planilha exportada do <strong className="text-gray-700">LegalOne</strong> (Andamentos / Publicações). O sistema irá filtrar automaticamente os registros pertinentes.
                                    </p>
                                    
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-6 py-3 bg-[#0a192f] hover:bg-[#112240] text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 text-sm"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Selecionar Planilha
                                    </button>
                                    
                                    <p className="text-xs font-bold text-gray-400 mt-6 uppercase tracking-widest">
                                        Formatos suportados: .XLSX, .CSV
                                    </p>
                                </div>
                            ) : (
                                /* Results Table State */
                                <div className="flex flex-col flex-1 h-full min-h-[500px]">
                                    {/* Table Content */}
                                    <div className="flex-1 overflow-x-auto rounded-2xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 z-10">
                                                <tr className="bg-[#1e3a8a] text-white text-[10px] font-bold uppercase tracking-widest border-b border-[#112240]">
                                                    <th className="p-4 rounded-tl-xl font-black">Processo (CNJ) / Responsável</th>
                                                    <th className="p-4 text-center font-black">UF</th>
                                                    <th className="p-4 text-center font-black">Data And.</th>
                                                    <th className="p-4 w-[45%] font-black">Descrição (Recorte)</th>
                                                    <th className="p-4 text-center rounded-tr-xl font-black">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {displayedData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="p-12 text-center text-gray-400">
                                                            Nenhum registro encontrado para a busca atual.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    displayedData.map((row) => (
                                                        <tr 
                                                            key={row.id} 
                                                            onClick={(e) => {
                                                                // Se clicar em um botão das ações, não abre o modal
                                                                if ((e.target as HTMLElement).closest('button')) return;
                                                                setActiveModalTab(0);
                                                                setSelectedItem(row);
                                                            }}
                                                            className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors group cursor-pointer"
                                                        >
                                                            <td className="p-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-[#0a192f] text-sm group-hover:text-[#1e3a8a] transition-colors whitespace-nowrap">{row.cnj}</span>
                                                                    <span className="text-xs text-gray-500 font-semibold mt-0.5">{row.responsavel}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-center whitespace-nowrap">
                                                                <span className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-black uppercase border border-gray-200">
                                                                    {row.uf || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-center text-xs text-gray-500 font-semibold">
                                                                {row.andamentos?.length > 1 ? (
                                                                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100 font-bold">{row.andamentos.length} andamentos</span>
                                                                ) : row.andamentos?.[0]?.dataAndamento || '-'}
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="text-xs text-gray-600 line-clamp-2 max-w-lg leading-relaxed" title="Clique para ler a decisão completa">
                                                                    <HighlightText text={row.andamentos?.[0]?.descricao || ''} snippet={true} />
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleMarkAsPrescrito(row); }}
                                                                        className="p-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded transition-colors border border-orange-200"
                                                                        title="Marcar como Prescrito"
                                                                    >
                                                                        <Hourglass className="w-4 h-4" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleAction(row, 'recebido'); }}
                                                                        className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors border border-emerald-200"
                                                                        title="Marcar como Recebido"
                                                                    >
                                                                        <Wallet className="w-4 h-4" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleAction(row, 'verificado'); }}
                                                                        className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors border border-emerald-200"
                                                                        title="Verificar (Salvar para enviar)"
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleAction(row, 'descartado'); }}
                                                                        className="p-1.5 text-gray-400 bg-gray-50 hover:bg-gray-200 hover:text-red-500 rounded transition-colors border border-gray-200"
                                                                        title="Descartar Falso Positivo"
                                                                    >
                                                                        <XCircle className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Base Confirmation Modal */}
            <Transition.Root show={isClearModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[9999]" onClose={setIsClearModalOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-8 border border-gray-100 border-t-4 border-t-red-500">
                                    <div>
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 ring-8 ring-red-50">
                                            <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
                                        </div>
                                        <div className="mt-6 text-center">
                                            <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                                                Atenção
                                            </Dialog.Title>
                                            <div className="mt-3">
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    Tem certeza que deseja <strong className="text-red-600">limpar completamente a base local</strong> de sucumbências?
                                                    <br/><br/>
                                                    Isso removerá todos os registros identificados, mas <strong className="text-gray-900">não excluirá</strong> os andamentos já salvos com sucesso (Verificados/Descartados).
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-red-500 hover:to-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:w-auto transition-all"
                                            onClick={async () => {
                                                setIsClearModalOpen(false);
                                                setLoading(true);
                                                try {
                                                    await supabase.from('sucumbencias').delete().eq('status', 'potencial');
                                                    await fetchSucumbencias();
                                                } catch(e) {
                                                    console.error('Error clearing base:', e);
                                                    setLoading(false);
                                                }
                                            }}
                                        >
                                            Sim, Limpar Tudo
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 sm:w-auto transition-all"
                                            onClick={() => setIsClearModalOpen(false)}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Modal de Detalhes (Simples) */}
            {selectedItem && selectedItem.andamentos[activeModalTab] && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl min-h-[500px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-xl border border-white/20">
                                    <Award className="w-6 h-6 text-blue-200" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">{selectedItem.cnj}</h2>
                                    <p className="text-sm font-medium text-blue-200 mt-1">Responsável: {selectedItem.responsavel}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                <Award className="w-5 h-5 opacity-0" /> {/* Spacer or close icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute top-6 right-6 w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        
                        {/* Tabs para Andamentos se houver mais de um */}
                        {selectedItem.andamentos.length > 1 && (
                            <div className="flex overflow-x-auto bg-white border-b border-gray-100 px-6 pt-4 gap-2 no-scrollbar">
                                {selectedItem.andamentos.map((and, idx) => (
                                    <button
                                        key={and.id}
                                        onClick={() => setActiveModalTab(idx)}
                                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                                            activeModalTab === idx 
                                                ? 'border-[#1e3a8a] text-[#1e3a8a]' 
                                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                        }`}
                                    >
                                        {and.dataAndamento}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                            
                            <div className="flex gap-4 mb-3">
                                <div className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                    <span className="block text-[10px] uppercase font-black tracking-widest text-[#1e3a8a] opacity-80 mb-1">Cliente ({selectedItem.posicao_cliente || '-'})</span>
                                    <span className="text-sm font-bold text-[#0a192f]">{selectedItem.cliente || '-'}</span>
                                </div>
                                <div className="flex-[0.2] flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center font-black italic shadow-inner">VS</div>
                                </div>
                                <div className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                    <span className="block text-[10px] uppercase font-black tracking-widest text-red-700 opacity-80 mb-1">Parte Contrária</span>
                                    <span className="text-sm font-bold text-[#0a192f]">{selectedItem.contrario || '-'}</span>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <span className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Data do Andamento</span>
                                    <span className="text-sm font-bold text-[#0a192f]">{selectedItem.andamentos[activeModalTab].dataAndamento}</span>
                                </div>
                                <div className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <span className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">UF</span>
                                    <span className="text-sm font-bold text-[#0a192f]">{selectedItem.uf || '-'}</span>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm relative flex flex-col flex-1">
                                <span className="block text-[10px] uppercase font-black tracking-widest text-blue-500 mb-3 flex items-center gap-2">
                                    <FileText className="w-3 h-3" />
                                    Descrição Completa / Publicação
                                </span>
                                <div className="text-sm text-gray-700 leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                                    <HighlightText text={selectedItem.andamentos[activeModalTab].descricao} />
                                </div>
                            </div>

                        </div>
                        
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center rounded-b-2xl">
                            <div className="flex gap-2">
                                {activeTab === 'potenciais' && (
                                    <button 
                                        onClick={() => handleMarkAsPrescrito(selectedItem)}
                                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold tracking-wide rounded-xl transition-colors text-xs flex items-center gap-2 shadow-sm"
                                    >
                                        <Hourglass className="w-4 h-4" />
                                        Prescrito
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleActionFromModal(selectedItem, 'descartado')}
                                    className="px-4 py-2 bg-white hover:bg-red-50 hover:text-red-600 border border-gray-200 text-gray-600 font-bold tracking-wide rounded-xl transition-all text-xs flex items-center gap-2 shadow-sm"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Descartar
                                </button>
                                <button 
                                    onClick={() => handleActionFromModal(selectedItem, 'recebido')}
                                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 text-emerald-700 hover:text-white font-bold tracking-wide rounded-xl transition-all text-xs flex items-center gap-2 shadow-sm"
                                >
                                    <Wallet className="w-4 h-4" />
                                    Recebido
                                </button>
                                <button 
                                    onClick={() => handleActionFromModal(selectedItem, 'verificado')}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 text-white font-bold tracking-wide rounded-xl transition-all text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Verificar
                                </button>
                            </div>

                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="px-5 py-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-xs shadow-sm"
                            >
                                Fechar Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
