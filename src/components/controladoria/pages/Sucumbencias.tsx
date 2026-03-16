import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
    Award, 
    Calendar,
    Loader2,
    TrendingUp,
    DollarSign,
    Scale,
    FileSignature,
    Upload,
    FileSpreadsheet,
    Search,
    FileText,
    Trash2,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

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

interface FilteredSucumbencia {
    id: string;
    responsavel: string;
    cnj: string;
    uf: string;
    dataAndamento: string;
    descricao: string;
    tipoAndamento: string;
    subtipoAndamento: string;
}

const HighlightText = ({ text }: { text: string }) => {
    if (!text) return null;
    
    const keywords = [
        'honorários de sucumbência', 'honorários advocatícios', 'honorarios de sucumbencia', 'honorarios advocaticios', 'sucumbência', 'sucumbencia',
        'condenar', 'condeno', 'condenou', 'condenação', 'condenacao', 'sentença', 'sentenca', 'pagamento', 'sucumbente', 'parte contrária', 'parte contraria', 'vencido'
    ];
    
    // Sort by length so longer phrases match first
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
    const regex = new RegExp(`(${sortedKeywords.join('|')})`, 'gi');
    
    const parts = text.split(regex);
    
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

export function Sucumbencias() {
    const [loading, setLoading] = useState(false); // Initially false, only true when parsing
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Data states - Initialize from localStorage
    const [importedData, setImportedData] = useState<FilteredSucumbencia[]>(() => {
        try {
            const savedData = localStorage.getItem('@salomao:sucumbenciasData');
            return savedData ? JSON.parse(savedData) : [];
        } catch {
            return [];
        }
    });
    
    const [hasImported, setHasImported] = useState(() => {
        try {
            const savedData = localStorage.getItem('@salomao:sucumbenciasData');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                return parsed && parsed.length > 0;
            }
            return false;
        } catch {
            return false;
        }
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<FilteredSucumbencia | null>(null);

    // Sync to localStorage when data changes
    useEffect(() => {
        localStorage.setItem('@salomao:sucumbenciasData', JSON.stringify(importedData));
    }, [importedData]);

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

    const handleQuickSelect = (type: '30_days' | '6_months' | 'this_year') => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        if (type === '30_days') {
            const past30 = new Date();
            past30.setDate(today.getDate() - 30);
            setStartDate(past30.toISOString().split('T')[0]);
            setEndDate(todayStr);
        } else if (type === '6_months') {
            const past6 = new Date();
            past6.setMonth(today.getMonth() - 6);
            setStartDate(past6.toISOString().split('T')[0]);
            setEndDate(todayStr);
        } else if (type === 'this_year') {
            setStartDate(`${today.getFullYear()}-01-01`);
            setEndDate(todayStr);
        }
    };

    // --- Supabase Actions ---
    const handleAction = async (item: FilteredSucumbencia, status: 'verificado' | 'descartado') => {
        try {
            // Optimistically remove from list
            const newList = importedData.filter(d => d.id !== item.id);
            setImportedData(newList);
            if (newList.length === 0) setHasImported(false);

            // Generate a simple hash to prevent re-importing the exactly same text for that process
            const hash_id = `${item.cnj}-${item.descricao.substring(0, 50).replace(/\s/g, '')}`.toLowerCase();

            // Insert into Supabase
            const { error } = await supabase.from('sucumbencias').insert({
                processo_cnj: item.cnj,
                responsavel: item.responsavel,
                uf: item.uf,
                data_andamento: item.dataAndamento,
                tipo_andamento: item.tipoAndamento,
                subtipo_andamento: item.subtipoAndamento,
                descricao: item.descricao,
                status: status,
                hash_id: hash_id
            });

            if (error) {
                // If it fails (e.g., duplicate hash), it's fine, we already removed it from view anyway
                console.warn('Supabase Insert Warning:', error.message);
            }
        } catch (error) {
            console.error('Action error:', error);
            alert('Erro ao salvar no banco de dados.');
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
            
            // Filter and map logic
            const filteredResults: FilteredSucumbencia[] = [];
            
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
                    const { data: existingRecords, error } = await supabase
                        .from('sucumbencias')
                        .select('hash_id')
                        .in('processo_cnj', rawCnjs);

                    if (!error && existingRecords) {
                        existingRecords.forEach(r => {
                            if (r.hash_id) existingHashes.add(r.hash_id);
                        });
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

                    let isMatch = false;

                    if (hasPrimary) {
                        if (searchString.length < 100) {
                            isMatch = true;
                        } else {
                            const hasContext = contextKeywords.some(kw => searchString.includes(kw));
                            if (hasContext) {
                                isMatch = true; 
                            }
                        }
                    }

                    if (isMatch) {
                        // Check deduplication
                        const cnjLabel = row['Número de CNJ'] || row['Pasta'] || 'Sem Número';
                        const descSubstring = desc.substring(0, 50).replace(/\s/g, '').toLowerCase();
                        const hash_id = `${cnjLabel}-${descSubstring}`;

                        if (existingHashes.has(hash_id)) continue; // Already reviewed!

                        filteredResults.push({
                            id: `import-${index}-${i}`,
                            responsavel: row['Responsável principal'] || 'Não Informado',
                            cnj: cnjLabel,
                            uf: row['UF'] || '-',
                            dataAndamento: dataAnd || '-',
                            descricao: desc || fieldDescricao, // Fallback to full field if parsed empty
                            tipoAndamento: tipo || fieldTipo,
                            subtipoAndamento: subtipo || fieldSubtipo
                        });
                    }
                }
            });

            if (filteredResults.length === 0) {
                alert('Todos os andamentos de sucumbência desta planilha já foram verificados ou descartados anteriormente (ou nenhum foi encontrado).');
                setLoading(false);
                return;
            }

            setImportedData(filteredResults);
            setHasImported(true);
        } catch (error) {
            console.error('Error parsing file:', error);
            alert('Erro ao processar o arquivo. Verifique se é uma planilha válida do LegalOne.');
        } finally {
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

    // Filtered data for display
    const displayedData = importedData.filter(item => 
        item.cnj.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2 sm:p-3 shadow-lg shrink-0">
                        <Award className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Honorários de Sucumbência</h1>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Gestão e acompanhamento de valores sucumbenciais</p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto relative">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => handleQuickSelect('30_days')}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors hover:bg-gray-200 text-gray-600"
                        >
                            30 Dias
                        </button>
                        <button
                            onClick={() => handleQuickSelect('6_months')}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors hover:bg-gray-200 text-gray-600"
                        >
                            6 Meses
                        </button>
                        <button
                            onClick={() => handleQuickSelect('this_year')}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors bg-white shadow-sm text-[#1e3a8a]"
                        >
                            Este Ano
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1 sm:ml-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-xs border-none outline-none text-gray-600 cursor-pointer bg-transparent w-28"
                        />
                        <span className="text-gray-300">até</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-xs border-none outline-none text-gray-600 cursor-pointer bg-transparent w-28"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando dados de sucumbência...</p>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Indicadores Principais (Placeholders) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all">
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Scale className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Processos Ativos</h3>
                            </div>
                            <div className="flex items-baseline gap-2 mt-2 relative z-10">
                                <span className="text-3xl font-black text-[#0a192f]">{hasImported ? importedData.length : 0}</span>
                                <span className="text-[11px] font-bold text-gray-500">encontrados</span>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all opacity-50 grayscale">
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Valor Total Esperado</h3>
                            </div>
                            <p className="text-2xl font-black text-emerald-700 mt-2 relative z-10">Em Breve</p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all opacity-50 grayscale">
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-amber-50 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-amber-600" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Valor Recebido</h3>
                            </div>
                            <p className="text-2xl font-black text-amber-700 mt-2 truncate relative z-10">Em Breve</p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all opacity-50 grayscale">
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <FileSignature className="w-5 h-5 text-purple-600" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Em Fase de Execução</h3>
                            </div>
                            <p className="text-3xl font-black text-purple-700 mt-2 truncate relative z-10">-</p>
                        </div>
                    </div>

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
                                    
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileUpload} 
                                        accept=".xlsx, .xls, .csv" 
                                        className="hidden" 
                                    />
                                    
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
                                    {/* Table Header Controls */}
                                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 rounded-lg">
                                                <Award className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">Potenciais Sucumbências</h3>
                                                <p className="text-xs text-gray-500 font-semibold mt-0.5">{importedData.length} registros identificados na planilha</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Buscar n°, resp. ou termo..." 
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] w-full sm:w-64 transition-all"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setHasImported(false);
                                                    setImportedData([]);
                                                    localStorage.removeItem('@salomao:sucumbenciasData');
                                                }}
                                                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border border-red-200"
                                                title="Limpar Base Completa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="hidden sm:inline">Limpar Base</span>
                                            </button>
                                            <button 
                                                onClick={() => setHasImported(false)}
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border border-gray-200"
                                                title="Importar Nova Planilha (Adicionar)"
                                            >
                                                <Upload className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Table Content */}
                                    <div className="flex-1 overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 z-10">
                                                <tr className="bg-gray-50/90 backdrop-blur-sm text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                                                    <th className="p-4">Processo (CNJ) / Responsável</th>
                                                    <th className="p-4 text-center">UF</th>
                                                    <th className="p-4 text-center">Data And.</th>
                                                    <th className="p-4">Tipo / Subtipo</th>
                                                    <th className="p-4 w-1/3">Descrição / Publicação</th>
                                                    <th className="p-4 text-center">Ações</th>
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
                                                            className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors group cursor-pointer"
                                                        >
                                                            <td className="p-4" onClick={() => setSelectedItem(row)}>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-[#0a192f] text-sm group-hover:text-[#1e3a8a] transition-colors whitespace-nowrap">{row.cnj}</span>
                                                                    <span className="text-xs text-gray-500 font-semibold mt-0.5">{row.responsavel}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-black uppercase border border-gray-200">
                                                                    {row.uf || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-center text-xs text-gray-500 font-semibold">
                                                                {row.dataAndamento}
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex flex-col space-y-1">
                                                                    <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded w-max border border-gray-200">{row.tipoAndamento || 'N/A'}</span>
                                                                    <span className="text-[10px] text-gray-500 truncate max-w-[150px]" title={row.subtipoAndamento}>{row.subtipoAndamento || '-'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4" onClick={() => setSelectedItem(row)}>
                                                                <div className="text-xs text-gray-600 line-clamp-3 max-w-lg leading-relaxed" title={row.descricao}>
                                                                    <HighlightText text={row.descricao} />
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleAction(row, 'verificado'); }}
                                                                        className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors border border-emerald-200"
                                                                        title="Verificar (Salvar)"
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

            {/* Modal de Detalhes (Simples) */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
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
                        
                        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <span className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Data do Andamento</span>
                                    <span className="text-sm font-bold text-[#0a192f]">{selectedItem.dataAndamento}</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <span className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">UF</span>
                                    <span className="text-sm font-bold text-[#0a192f]">{selectedItem.uf || '-'}</span>
                                </div>
                                <div className="col-span-2 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <span className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Tipo / Subtipo</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold">{selectedItem.tipoAndamento || 'N/A'}</span>
                                        <span className="text-gray-400 font-black">/</span>
                                        <span className="text-sm font-semibold text-gray-600">{selectedItem.subtipoAndamento || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm relative">
                                <span className="block text-[10px] uppercase font-black tracking-widest text-blue-500 mb-3 flex items-center gap-2">
                                    <FileText className="w-3 h-3" />
                                    Descrição Completa / Publicação
                                </span>
                                <div className="text-sm text-gray-700 leading-relaxed max-h-[250px] overflow-y-auto whitespace-pre-wrap">
                                    <HighlightText text={selectedItem.descricao} />
                                </div>
                            </div>

                        </div>
                        
                        <div className="p-4 bg-white border-t border-gray-100 flex justify-end">
                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
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
