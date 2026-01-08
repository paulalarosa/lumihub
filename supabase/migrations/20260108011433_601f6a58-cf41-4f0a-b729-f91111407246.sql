-- Tabela para armazenar dados bancários/recebimento dos usuários
CREATE TABLE public.payment_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- PIX
  pix_key_type TEXT, -- 'cpf', 'cnpj', 'email', 'phone', 'random'
  pix_key TEXT,
  
  -- Conta Bancária
  bank_name TEXT,
  bank_code TEXT,
  account_type TEXT, -- 'checking', 'savings'
  agency TEXT,
  account_number TEXT,
  account_holder_name TEXT,
  account_holder_document TEXT, -- CPF ou CNPJ
  
  -- Conta Digital (integração futura com Mercado Pago, PagBank, etc)
  digital_wallet_type TEXT, -- 'mercado_pago', 'pagbank', 'picpay', 'nubank', etc
  digital_wallet_account TEXT, -- email ou id da conta
  
  -- Preferência de recebimento
  preferred_method TEXT DEFAULT 'pix', -- 'pix', 'bank', 'digital_wallet'
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

-- Policies: Usuários só podem ver e gerenciar suas próprias contas
CREATE POLICY "Users can view their own payment accounts"
ON public.payment_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment account"
ON public.payment_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment account"
ON public.payment_accounts FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_payment_accounts_updated_at
  BEFORE UPDATE ON public.payment_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();