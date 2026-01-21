import { createClient } from '@supabase/supabase-js';
import { Transaction } from '../types';

/* 
  ==============================================================================
  🛠️ CONFIGURAÇÃO DO BANCO DE DADOS (SQL)
  ==============================================================================
  
  Vá no "SQL Editor" do Supabase e rode este código completo para criar a tabela
  e liberar as permissões de acesso:

  -- 1. Cria a tabela
  create table if not exists transactions (
    id text primary key,
    "orderNumber" text,
    timestamp bigint,
    items jsonb,
    subtotal numeric,
    discount numeric,
    total numeric,
    "paymentMethod" text,
    "amountPaid" numeric,
    change numeric,
    "sellerName" text,
    status text,
    "kitchenStatus" text
  );

  -- 2. Libera permissões (Necessário para o App salvar as vendas)
  alter table transactions enable row level security;
  
  create policy "Acesso Total" on transactions
  for all using (true) with check (true);

  ==============================================================================
*/

// ==============================================================================
// CONFIGURAÇÃO DE CREDENCIAIS
// ==============================================================================

const SUPABASE_URL = 'https://uayvvfiqzfzlwzcbggqy.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVheXZ2ZmlxemZ6bHd6Y2JnZ3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDYyNzYsImV4cCI6MjA4NDUyMjI3Nn0.V-CP7sywiRVeoZuhxgtWz86IkN0tbuV0MXnb_0nLOrM';

// ==============================================================================

const isConfigured = SUPABASE_URL.startsWith('https://') && 
                     SUPABASE_ANON_KEY.length > 20 && 
                     !SUPABASE_ANON_KEY.includes('COLE_');

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      db: { schema: 'public' }
    })
  : null;

// --- FUNÇÕES DE BANCO DE DADOS ---

export const fetchTransactions = async (): Promise<Transaction[] | null> => {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) {
      console.warn('Supabase Error (Fetch):', error.message);
      return null;
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
  try {
    await supabase.from('transactions').update({ status }).eq('id', id);
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
  }
};

export const updateKitchenStatus = async (id: string, kitchenStatus: 'pending' | 'done') => {
  if (!supabase) return;
  try {
    await supabase.from('transactions').update({ kitchenStatus }).eq('id', id);
  } catch (err) {
    console.error('Erro ao atualizar cozinha:', err);
  }
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