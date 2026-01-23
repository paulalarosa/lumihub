
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction } from '../hooks/useFinancials';

interface TransactionListProps {
    transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
    return (
        <Card className="bg-black border border-white/20 rounded-none">
            <CardContent className="p-6">
                <h3 className="text-lg text-white mb-6 font-mono uppercase tracking-widest">ÚLTIMAS TRANSAÇÕES</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {transactions.length === 0 ? (
                        <div className="text-center py-10 text-white/20 font-mono uppercase text-xs">
                            SEM DADOS ENCONTRADOS
                        </div>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-3 border border-white/5 hover:border-white/30 hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 border border-white/10 group-hover:border-white transition-colors`}>
                                        {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-white" /> : <ArrowDownRight className="h-4 w-4 text-white/50" />}
                                    </div>
                                    <div>
                                        <p className="text-white font-mono text-xs uppercase tracking-wide">{tx.description}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono uppercase">
                                            <span>{format(parseISO(tx.date), "dd MMM yyyy", { locale: ptBR })}</span>
                                            <span>//</span>
                                            <span className="capitalize">{tx.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`font-mono text-sm ${tx.type === 'income' ? 'text-white' : 'text-white/50'}`}>
                                    {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
