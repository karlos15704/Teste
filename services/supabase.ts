import { createClient } from '@supabase/supabase-js';
import { Transaction } from '../types';

// ==============================================================================
// CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE)
// ==============================================================================

// 1. URL DO PROJETO
const SUPABASE_URL = 'https://uayvvfiqzfzlwzcbggqy.supabase.co'; 

// 2. CHAVE PÚBLICA (CONFIGURADA)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVheXZ2ZmlxemZ6bHd6Y2JnZ3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDYyNzYsImV4cCI6MjA4NDUyMjI3Nn0.V-CP7sywiRVeoZuhxgtWz86IkN0tbuV0MXnb_0nLOrM';

// ==============================================================================

// Verificação simples para não quebrar o app se a chave não for colada
const isConfigured = SUPABASE_URL.startsWith('https://') && 
                     SUPABASE_ANON_KEY.length > 20 && 
                     !SUPABASE_ANON_KEY.includes('COLE_');

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// --- FUNÇÕES DE BANCO DE DADOS ---

export const fetchTransactions = async (): Promise<Transaction[]> => {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }
  return data as Transaction[];
};

export const createTransaction = async (transaction: Transaction) => {
  if (!supabase) return;

  const { error } = await supabase
    .from('transactions')
    .insert([transaction]);

  if (error) console.error('Erro ao criar transação:', error);
};

export const updateTransactionStatus = async (id: string, status: 'completed' | 'cancelled') => {
  if (!supabase) return;

  const { error } = await supabase
    .from('transactions')
    .update({ status })
    .eq('id', id);

  if (error) console.error('Erro ao atualizar status:', error);
};

export const updateKitchenStatus = async (id: string, kitchenStatus: 'pending' | 'done') => {
  if (!supabase) return;

  const { error } = await supabase
    .from('transactions')
    .update({ kitchenStatus })
    .eq('id', id);

  if (error) console.error('Erro ao atualizar cozinha:', error);
};

export const subscribeToTransactions = (onUpdate: () => void) => {
  if (!supabase) return;

  return supabase
    .channel('transactions_channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
      onUpdate();
    })
    .subscribe();
};