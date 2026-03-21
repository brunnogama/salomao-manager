import { useState, useEffect, useRef, Fragment, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { Dialog, Transition } from '@headlessui/react';
import { 
    Award, 
    Calendar,
    Loader2,
    Upload,
    FileSpreadsheet,
    FileText,
    Trash2,
    XCircle,
    AlertTriangle,
    Wallet,
    Hourglass,
    Clock,
    User
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { FilterBar, FilterCategory } from '../../collaborators/components/FilterBar';

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
    obs?: string;
    status?: 'potencial' | 'prescrito' | 'descartado' | 'recebido' | 'aguardando';
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
    const [loading, setLoading] = useState(true); // Loading starts as true to prevent FOUC / empty state flash
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Data states - Initialize empty, IndexedDB will fill them
    const [importedData, setImportedData] = useState<FilteredSucumbencia[]>([]);
    const [hasImported, setHasImported] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterResponsavel, setFilterResponsavel] = useState('Todos');
    const [selectedItem, setSelectedItem] = useState<FilteredSucumbencia | null>(null);
    const [activeTab, setActiveTab] = useState<'potenciais' | 'prescritos' | 'descartados' | 'recebidos' | 'aguardando'>('potenciais');
    const [activeModalTab, setActiveModalTab] = useState(0);

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 200;

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
                        obs: row.obs || '',
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
    const [startDate, setStartDate] = useState('');

    const [endDate, setEndDate] = useState('');

    // --- Supabase Actions ---
    const handleAction = async (item: FilteredSucumbencia, status: 'aguardando' | 'descartado' | 'recebido' | 'prescrito') => {
        try {
            // Se o usuário clicar na mesma ação atual, reverta para potencial (Toggle switch)
            const targetStatus = item.status === status ? 'potencial' : status;

            // Optimistically update the status
            setImportedData(prev => prev.map(d => d.id === item.id ? { ...d, status: targetStatus } : d));

            // Update in Supabase
            const { error } = await supabase
                .from('sucumbencias')
                .update({ status: targetStatus })
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

    const debounceSaveObs = useRef<NodeJS.Timeout>();

    const handleObsChange = (item: FilteredSucumbencia, newObs: string) => {
        // Atualiza localmente imediato para a UI não travar a digitação
        setImportedData(prev => prev.map(d => d.id === item.id ? { ...d, obs: newObs } : d));
        if (selectedItem?.id === item.id) {
            setSelectedItem(prev => prev ? { ...prev, obs: newObs } : null);
        }

        // Debounce para não bombardear o Supabase a cada tecla digitada
        if (debounceSaveObs.current) {
            clearTimeout(debounceSaveObs.current);
        }

        debounceSaveObs.current = setTimeout(async () => {
            try {
                const { error } = await supabase
                    .from('sucumbencias')
                    .update({ obs: newObs })
                    .eq('processo_cnj', item.cnj);

                if (error) {
                    console.error('Supabase Obs Update Error:', error.message);
                }
            } catch (err) {
                console.error('Erro ao salvar observação:', err);
            }
        }, 800);
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
                const fieldDataAndamento = String(row['Data do Andamento'] || row['Data Andamento'] || row['Data da Movimentação'] || row['Data'] || '');
                const fieldDescricao = String(row['Descrição'] || row['Descricao'] || row['Andamento'] || '');
                const fieldTipo = String(row['Tipo do Andamento'] || row['Tipo Andamento'] || row['Tipo'] || '');
                const fieldSubtipo = String(row['Subtipo Andamentos'] || row['Subtipo do Andamento'] || row['Subtipo'] || '');

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
                                responsavel: row['Responsável principal'] || row['Responsável'] || 'Não Informado',
                                cnj: cnjLabel,
                                uf: row['UF'] || row['Estado'] || '-',
                                cliente: String(row['Cliente'] || row['Cliente principal'] || row['Clientes'] || '').substring(0, 254),
                                posicao_cliente: String(row['Posição do Cliente'] || row['Posição do cliente'] || row['Posição do cliente principal'] || '').substring(0, 254),
                                contrario: String(row['Contrário'] || row['Contrário(s) principal(is)'] || row['Parte contrária'] || row['Adverso'] || '').substring(0, 254),
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
        if (activeTab === 'aguardando') return itemStatus === 'aguardando';
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

    const handleActionFromModal = (item: FilteredSucumbencia, status: 'aguardando' | 'descartado' | 'recebido') => {
        handleAction(item, status);
        setSelectedItem(null);
    };

    // Reseta a paginação ao mudar qualquer filtro
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, filterResponsavel, startDate, endDate]);

    // Aplica a paginação sobre os dados já filtrados
    const totalPages = Math.ceil(displayedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const finalPaginatedData = displayedData.slice(startIndex, startIndex + itemsPerPage);

    // FilterBar: categorias, chips, count
    const responsavelOptions = useMemo(() => 
        uniqueResponsaveis.map(r => ({ label: r, value: r })),
    [uniqueResponsaveis]);

    const filterCategories = useMemo((): FilterCategory[] => [
        {
            key: 'responsavel',
            label: 'Responsável',
            icon: User,
            type: 'single',
            options: responsavelOptions,
            value: filterResponsavel === 'Todos' ? '' : filterResponsavel,
            onChange: (val: string) => setFilterResponsavel(val || 'Todos'),
        },
    ], [filterResponsavel, responsavelOptions]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filterResponsavel !== 'Todos') count++;
        if (startDate) count++;
        if (endDate) count++;
        return count;
    }, [filterResponsavel, startDate, endDate]);

    const activeFilterChips = useMemo(() => {
        const chips: { key: string; label: string; onClear: () => void }[] = [];
        if (filterResponsavel !== 'Todos') {
            chips.push({ key: 'responsavel', label: `Resp: ${filterResponsavel}`, onClear: () => setFilterResponsavel('Todos') });
        }
        if (startDate) {
            chips.push({ key: 'startDate', label: `De: ${new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR')}`, onClear: () => setStartDate('') });
        }
        if (endDate) {
            chips.push({ key: 'endDate', label: `Até: ${new Date(endDate + 'T12:00:00').toLocaleDateString('pt-BR')}`, onClear: () => setEndDate('') });
        }
        return chips;
    }, [filterResponsavel, startDate, endDate]);

    const clearAllFilters = () => {
        setSearchTerm('');
        setFilterResponsavel('Todos');
        setStartDate('');
        setEndDate('');
    };

    return (
        <>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
        />
        <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-500">
              {/* Left: Título e Ícone */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2.5 sm:p-3 shadow-lg shrink-0">
                  <Award className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Sucumbências</h1>
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Gestão e acompanhamento de valores sucumbenciais</p>
                </div>
              </div>

              {/* Right: Abas + Ações */}
              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end mt-2 md:mt-0">
                {/* Abas */}
                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setActiveTab('potenciais')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'potenciais' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Wallet className="h-4 w-4" /> Potenciais
                    <span className={`min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'potenciais' ? 'bg-blue-50 text-blue-600' : 'bg-gray-200/60 text-gray-500'}`}>
                      {importedData.filter(d => (d.status || 'potencial') === 'potencial').length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('prescritos')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'prescritos' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Clock className="h-4 w-4" /> Prescritos
                    <span className={`min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'prescritos' ? 'bg-amber-50 text-amber-600' : 'bg-gray-200/60 text-gray-500'}`}>
                      {importedData.filter(d => d.status === 'prescrito').length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('recebidos')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'recebidos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Wallet className="h-4 w-4" /> Já Pagos
                    <span className={`min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'recebidos' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200/60 text-gray-500'}`}>
                      {importedData.filter(d => d.status === 'recebido').length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('aguardando')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'aguardando' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Hourglass className="h-4 w-4" /> Aguardando
                    <span className={`min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'aguardando' ? 'bg-amber-50 text-amber-600' : 'bg-gray-200/60 text-gray-500'}`}>
                      {importedData.filter(d => d.status === 'aguardando').length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('descartados')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'descartados' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <XCircle className="h-4 w-4" /> Descartados
                    <span className={`min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'descartados' ? 'bg-red-50 text-red-600' : 'bg-gray-200/60 text-gray-500'}`}>
                      {importedData.filter(d => d.status === 'descartado').length}
                    </span>
                  </button>
                </div>

                {/* Ícones redondos */}
                <div className="flex items-center gap-2 border-l border-gray-100 pl-3 ml-1">
                  <button
                    onClick={() => setIsClearModalOpen(true)}
                    className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 text-red-500 rounded-full hover:bg-red-50 transition-all shadow-sm"
                    title="Limpar Base"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30"
                    title="Importar Relatório LegalOne"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* KPI Card + FilterBar */}
            {hasImported && (
              <div className="flex flex-col lg:flex-row items-stretch gap-4">
                {/* Cards de KPI */}
                <div className="flex items-stretch gap-3 shrink-0">
                  {/* Card de KPI - Processos */}
                  <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Hourglass className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">Processos</span>
                      <span className="text-xl font-black text-[#0a192f] leading-tight">{importedData.filter(d => (d.status || 'potencial') === 'potencial').length.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  {/* Card de KPI - Andamentos */}
                  <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Award className="h-5 w-5 text-[#1e3a8a]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">Andamentos</span>
                      <span className="text-xl font-black text-[#0a192f] leading-tight">{displayedData.reduce((acc, curr) => acc + curr.andamentos.length, 0).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* FilterBar */}
                <div className="flex-1">
                  <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    categories={filterCategories}
                    activeFilterChips={activeFilterChips}
                    activeFilterCount={activeFilterCount}
                    onClearAll={clearAllFilters}
                    extraContent={
                      <div className="px-4 py-3 space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Período</div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-2 flex-1 hover:border-[#1e3a8a] transition-all">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider pl-1">De</span>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="bg-transparent border-none text-sm p-0.5 outline-none text-gray-700 font-medium cursor-pointer w-full"
                            />
                          </div>
                          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-2 flex-1 hover:border-[#1e3a8a] transition-all">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider pl-1">Até</span>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="bg-transparent border-none text-sm p-0.5 outline-none text-gray-700 font-medium cursor-pointer w-full"
                            />
                          </div>
                        </div>
                      </div>
                    }
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
                                                {finalPaginatedData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="p-12 text-center text-gray-400">
                                                            Nenhum registro encontrado para a busca atual.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    finalPaginatedData.map((row) => (
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
                                                                        title="Marcar como Pago"
                                                                    >
                                                                        <Wallet className="w-4 h-4" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleAction(row, 'aguardando'); }}
                                                                        className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded transition-colors border border-amber-200"
                                                                        title="Aguardar (Salvar para enviar)"
                                                                    >
                                                                        <Clock className="w-4 h-4" />
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
                                    
                                    {/* Pagination Controls */}
                                    {displayedData.length > 0 && (
                                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6 rounded-b-2xl shrink-0">
                                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-700">
                                                        Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(startIndex + itemsPerPage, displayedData.length)}</span> de{' '}
                                                        <span className="font-medium">{displayedData.length}</span> resultados
                                                    </p>
                                                </div>
                                                <div>
                                                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                                        <button
                                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                            disabled={currentPage === 1}
                                                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <span className="sr-only">Anterior</span>
                                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                        
                                                        {/* Simple Page Indicator */}
                                                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0">
                                                            Página {currentPage} de {totalPages}
                                                        </span>

                                                        <button
                                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                            disabled={currentPage === totalPages}
                                                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <span className="sr-only">Próxima</span>
                                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </nav>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Base Confirmation Modal */}
            {isClearModalOpen && typeof document !== 'undefined' && createPortal(
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
            , document.body)}

            {/* Modal de Detalhes (Simples) */}
            {selectedItem && selectedItem.andamentos[activeModalTab] && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] min-h-[500px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white flex justify-between items-start shrink-0">
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
                                    <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-400" />
                                        {selectedItem.andamentos[0]?.dataAndamento || '-'}
                                    </span>
                                </div>
                                <div className="flex-[0.5] bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <span className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">UF</span>
                                    <span className="text-sm font-bold text-gray-800">{selectedItem.uf}</span>
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <span className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Observações / Controle Interno</span>
                                <textarea
                                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700 shadow-sm focus:ring-2 focus:ring-[#0a192f] focus:border-[#0a192f] transition-all resize-y min-h-[100px]"
                                    placeholder="Adicione anotações livres sobre este caso (ex: Feito contato em 12/03, aguardando financeiro...)"
                                    value={selectedItem.obs || ''}
                                    onChange={(e) => handleObsChange(selectedItem, e.target.value)}
                                />
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
                                    Pago
                                </button>
                                <button 
                                    onClick={() => handleActionFromModal(selectedItem, 'aguardando')}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 border border-amber-600 text-white font-bold tracking-wide rounded-xl transition-all text-xs flex items-center gap-2 shadow-md shadow-amber-600/20"
                                >
                                    <Clock className="w-4 h-4" />
                                    Aguardar
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
            , document.body)}
        </div>
        </>
    );
}
