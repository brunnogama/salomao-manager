import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Contract } from '../../../types/controladoria';
import { toTitleCase } from '../utils/masks';

export interface UseContractOptionsProps {
    formData: Contract;
    setFormData: React.Dispatch<React.SetStateAction<Contract>>;
}

export function useContractOptions({ formData, setFormData }: UseContractOptionsProps) {
    // Estados Locais das Listas
    const [legalAreas, setLegalAreas] = useState<string[]>(['Trabalhista', 'Cível', 'Tributário', 'Empresarial', 'Previdenciário', 'Família', 'Criminal', 'Consumidor']);
    const [billingLocations, setBillingLocations] = useState<string[]>([]);

    const [clientOptions, setClientOptions] = useState<string[]>([]);
    const [clientCnpjMap, setClientCnpjMap] = useState<Record<string, string>>({});

    const [opponentOptions, setOpponentOptions] = useState<string[]>([]);
    const [opponentCnpjMap, setOpponentCnpjMap] = useState<Record<string, string>>({});
    
    // Carregar dados iniciais
    const fetchAuxiliaryTables = async () => {
        // Removed courtOptions fetch as it's no longer a state managed here.
        // const { data: courts } = await supabase.from('courts').select('name').order('name');
        // if (courts) setCourtOptions(Array.from(new Set([...DEFAULT_COURTS, ...courts.map(c => c.name)])).sort((a, b) => a.localeCompare(b)));

        // Buscando Opponents e seus CNPJs
        const { data: opps } = await supabase.from('opponents').select('name, cnpj').order('name');
        if (opps) {
            const cnpjSeen = new Set<string>();
            const nameSeen = new Set<string>();
            const uniqueNames: string[] = [];
            const nameToCnpj: Record<string, string> = {};

            opps.forEach(o => {
                if (!o.name || o.name.trim() === '') return;
                const cnpjClean = o.cnpj?.replace(/\D/g, '') || '';
                if (o.cnpj && o.name) nameToCnpj[o.name] = o.cnpj;

                if (cnpjClean.length > 0) {
                    if (!cnpjSeen.has(cnpjClean)) {
                        cnpjSeen.add(cnpjClean);
                        if (!nameSeen.has(o.name)) {
                            nameSeen.add(o.name);
                            uniqueNames.push(o.name);
                        }
                    }
                } else {
                    if (!nameSeen.has(o.name)) {
                        nameSeen.add(o.name);
                        uniqueNames.push(o.name);
                    }
                }
            });

            setOpponentOptions(uniqueNames.sort((a, b) => a.localeCompare(b)));
            setOpponentCnpjMap(nameToCnpj);
        }

        // 🔧 CORREÇÃO PRINCIPAL: Remover duplicatas de clientes por CNPJ
        const { data: clients } = await supabase.from('clients').select('name, cnpj').order('name');
        if (clients) {
            const cnpjSeen = new Set<string>();
            const nameSeen = new Set<string>();
            const uniqueNames: string[] = [];
            const nameToCnpj: Record<string, string> = {};

            clients.forEach(c => {
                if (!c.name || c.name.trim() === '') return;
                const cnpjClean = c.cnpj?.replace(/\D/g, '') || '';
                
                if (c.cnpj && c.name) {
                    nameToCnpj[c.name] = c.cnpj;
                }

                if (cnpjClean.length > 0) {
                    // Agrupar por CNPJ — manter o primeiro nome encontrado
                    if (!cnpjSeen.has(cnpjClean)) {
                        cnpjSeen.add(cnpjClean);
                        if (!nameSeen.has(c.name)) {
                            nameSeen.add(c.name);
                            uniqueNames.push(c.name);
                        }
                    }
                } else {
                    // Sem CNPJ — deduplicar por nome
                    if (!nameSeen.has(c.name)) {
                        nameSeen.add(c.name);
                        uniqueNames.push(c.name);
                    }
                }
            });

            setClientOptions(uniqueNames.sort((a, b) => a.localeCompare(b)));
            setClientCnpjMap(nameToCnpj);
        }

        // 🔧 Buscar locais de faturamento únicos
        const { data: contracts } = await supabase.from('contracts').select('billing_location');
        if (contracts) {
            const uniqueLocations = Array.from(new Set(contracts.map(c => (c as any).billing_location).filter(Boolean)));
            setBillingLocations(uniqueLocations.sort() as string[]);
        }

    };

    // Generic add handler
    const handleGenericAdd = async (type: string, newValue: string) => {
        const cleanValue = toTitleCase(newValue.trim());
        if (!cleanValue) return false;

        let error = null;

        try {
            switch (type) {
                case 'area':
                    if (!legalAreas.includes(cleanValue)) {
                        setLegalAreas(prev => [...prev, cleanValue].sort((a, b) => a.localeCompare(b)));
                        if (!formData.area) setFormData(prev => ({ ...prev, area: cleanValue }));
                    }
                    break;
                case 'location':
                    if (!billingLocations.includes(cleanValue)) {
                        setBillingLocations(prev => [...prev, cleanValue].sort((a, b) => a.localeCompare(b)));
                        if (!formData.billing_location) setFormData(prev => ({ ...prev, billing_location: cleanValue }));
                    }
                    break;
                case 'client':
                    if (!clientOptions.includes(cleanValue)) {
                        const { error: err } = await supabase.from('clients').insert({ name: cleanValue });
                        error = err;
                        if (!err) {
                            setClientOptions(prev => [...prev, cleanValue].sort((a, b) => a.localeCompare(b)));
                            if (!formData.client_name) setFormData(prev => ({ ...prev, client_name: cleanValue }));
                        }
                    }
                    break;
                case 'opponent':
                    if (!opponentOptions.includes(cleanValue)) {
                        const { error: err } = await supabase.from('opponents').insert({ name: cleanValue });
                        error = err;
                        if (!err) {
                            setOpponentOptions(prev => [...prev, cleanValue].sort((a, b) => a.localeCompare(b)));
                        }
                    }
                    break;
                default:
                    console.warn(`handleGenericAdd: Unhandled type "${type}"`);
                    return false;
            }
        } catch (err: any) {
            error = err;
            console.error(error);
        }

        return !error;
    };

    // Lógica de Editar
    const handleGenericEdit = async (type: string, oldValue: string, newValue: string) => {
        const cleanOld = oldValue.trim();
        const cleanNew = toTitleCase(newValue.trim());
        if (!cleanNew || cleanNew === cleanOld) return false;

        let error = null;

        try {
            switch (type) {
                case 'location':
                    const { error: errLoc } = await supabase.from('contracts').update({ billing_location: cleanNew }).eq('billing_location', cleanOld);
                    error = errLoc;
                    if (!errLoc) {
                        setBillingLocations(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a, b) => a.localeCompare(b)));
                        if (formData.billing_location === cleanOld) setFormData(prev => ({ ...prev, billing_location: cleanNew }));
                    }
                    break;
                    break;
                case 'client':
                    const { error: errCli } = await supabase.from('clients').update({ name: cleanNew }).eq('name', cleanOld);
                    error = errCli;
                    if (!errCli) {
                        setClientOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a, b) => a.localeCompare(b)));
                        if (formData.client_name === cleanOld) setFormData(prev => ({ ...prev, client_name: cleanNew }));
                    }
                    break;
                case 'opponent':
                    const { error: errOpp } = await supabase.from('opponents').update({ name: cleanNew }).eq('name', cleanOld);
                    error = errOpp;
                    if (!errOpp) {
                        setOpponentOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a, b) => a.localeCompare(b)));
                    }
                    break;
                default:
                    console.warn(`handleGenericEdit: Unhandled type "${type}"`);
                    return false;
            }
        } catch (err: any) {
            error = err;
            console.error(error);
        }

        return !error;
    };

    const handleGenericRemove = async (type: string, value: string) => {
      // Stub or implement removal logic if needed for OptionManager.
      console.log(`Remove ${value} from ${type}`);
      return true;
    }

    return {
        legalAreas,
        billingLocations,
        clientOptions,
        clientCnpjMap,
        opponentOptions,
        opponentCnpjMap,
        fetchAuxiliaryTables,
        handleGenericAdd,
        handleGenericEdit,
        handleGenericRemove
    };
}