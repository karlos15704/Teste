import { createClient } from '@supabase/supabase-js';
import { Transaction } from '../types';

// ==============================================================================
// CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE)
// ==============================================================================

const SUPABASE_URL = 'https://uayvvfiqzfzlwzcbggqy.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVheXZ2ZmlxemZ6bHd6Y2JnZ3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDYyNzYsImV4cCI6MjA4NDUyMjI3Nn0.V-CP7sywiRVeoZuhxgtWz86IkN0tbuV0MXnb_0nLOrM';

// ==============================================================================

// Verificação de segurança
const isConfigured = SUPABASE_URL.startsWith('https://') && 
                     SUPABASE_ANON_KEY.length > 20 && 
                     !SUPABASE_ANON_KEY.includes('COLE_');

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      db: { schema: 'public' }
    })
  : null;

// --- FUNÇÕES DE BANCO DE DADOS BLINDADAS ---

// Retorna Transaction[] se sucesso, ou NULL se erro (para não limpar a tela localmente)
export const fetchTransactions = async (): Promise<Transaction[] | null> => {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) {
      console.warn('Supabase Error (Fetch):', error.message);
      return null; // Retorna null para indicar falha de conexão
    }
    
    return data as Transaction[];
  } catch (err) {
    console.warn('Network Error (Fetch):', err);
    return null;
  }
};

export const createTransaction = async (transaction: Transaction): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('transactions')
      .insert([transaction]);

    if (error) {
      console.warn('Supabase Error (Create):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network Error (Create):', err);
    return false;
  }
};

export const updateTransactionStatus = async (id: string, status: 'completed' | 'cancelled') => {
  if (!supabase) return;
  await supabase.from('transactions').update({ status }).eq('id', id);
};

export const updateKitchenStatus = async (id: string, kitchenStatus: 'pending' | 'done') => {
  if (!supabase) return;
  await supabase.from('transactions').update({ kitchenStatus }).eq('id', id);
};

export const subscribeToTransactions = (onUpdate: () => void) => {
  if (!supabase) return;

  const channel = supabase
    .channel('transactions_channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
      onUpdate();
    })
    .subscribe();

  return channel;
};