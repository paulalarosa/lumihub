
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Plus, DollarSign, Trash2 } from 'lucide-react';

import type { ServiceUI, ProjectServiceItem } from '@/types/api.types';

interface ProjectFinancialsProps {
    totalServiceAmount: number;
    totalPaidAmount: number;
    projectServices: ProjectServiceItem[];
    services: ServiceUI[];
    t: (key: string) => string;

    // Add Service Form
    isServiceDialogOpen: boolean;
    setIsServiceDialogOpen: (open: boolean) => void;
    selectedServiceId: string;
    handleSelectService: (id: string) => void;
    serviceQuantity: string;
    setServiceQuantity: (val: string) => void;
    servicePrice: string;
    setServicePrice: (val: string) => void;
    addServiceToProject: (e: React.FormEvent) => void;
    removeServiceFromProject: (id: string) => void;

    // Payment Form
    isPaymentDialogOpen: boolean;
    setIsPaymentDialogOpen: (open: boolean) => void;
    paymentServiceId: string;
    setPaymentServiceId: (val: string) => void;
    paymentAmount: string;
    setPaymentAmount: (val: string) => void;
    paymentDescription: string;
    setPaymentDescription: (val: string) => void;
    registerPayment: (e: React.FormEvent) => void;
}

export const ProjectFinancials = ({
    totalServiceAmount,
    totalPaidAmount,
    projectServices,
    services,
    t,
    isServiceDialogOpen,
    setIsServiceDialogOpen,
    selectedServiceId,
    handleSelectService,
    serviceQuantity,
    setServiceQuantity,
    servicePrice,
    setServicePrice,
    addServiceToProject,
    removeServiceFromProject,
    isPaymentDialogOpen,
    setIsPaymentDialogOpen,
    paymentServiceId,
    setPaymentServiceId,
    paymentAmount,
    setPaymentAmount,
    paymentDescription,
    setPaymentDescription,
    registerPayment
}: ProjectFinancialsProps) => {
    return (
        <div className="space-y-6">
            {/* Payment Progress */}
            <Card className="bg-black border border-white/20 rounded-none">
                <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-white font-serif uppercase tracking-wide">VISÃO FINANCEIRA GERAL</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm font-mono text-white/70 uppercase tracking-widest">
                            <span>PAGO: {Number(totalPaidAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            <span>TOTAL: {Number(totalServiceAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <Progress value={totalServiceAmount > 0 ? (totalPaidAmount / totalServiceAmount) * 100 : 0} className="h-2 rounded-none bg-white/10" />
                        <div className="text-right">
                            <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
                                {((totalServiceAmount > 0 ? (totalPaidAmount / totalServiceAmount) * 100 : 0)).toFixed(1)}% RECUPERADO
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Services List */}
            <Card className="bg-black border border-white/20 rounded-none">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
                    <div>
                        <CardTitle className="text-white font-serif uppercase tracking-wide">DETALHAMENTO DE SERVIÇOS</CardTitle>
                    </div>
                    <div className="flex gap-2">
                        {/* Add Service Dialog */}
                        <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest">
                                    <Plus className="h-3 w-3 mr-2" /> {t('dashboard.add_service') || 'ADICIONAR ITEM DE SERVIÇO'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-black border border-white/20 rounded-none">
                                <DialogHeader>
                                    <DialogTitle className="text-white font-serif uppercase">ADICIONAR ITEM DE SERVIÇO</DialogTitle>
                                    <DialogDescription className="sr-only">
                                        Selecione um serviço do catálogo para vincular a este projeto.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={addServiceToProject} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">TIPO DE SERVIÇO</Label>
                                        <Select value={selectedServiceId} onValueChange={handleSelectService}>
                                            <SelectTrigger className="bg-black border-white/20 rounded-none text-white font-mono uppercase">
                                                <SelectValue placeholder="SELECIONE..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-black border border-white/20 rounded-none text-white">
                                                {services.map(s => (
                                                    <SelectItem key={s.id} value={s.id} className="font-mono uppercase focus:bg-white focus:text-black">
                                                        {s.name} - {Number(s.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="space-y-2 flex-1">
                                            <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">QTD</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={serviceQuantity}
                                                onChange={(e) => setServiceQuantity(e.target.value)}
                                                className="bg-black border-white/20 rounded-none text-white font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">PREÇO (UNIT)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={servicePrice}
                                                onChange={(e) => setServicePrice(e.target.value)}
                                                className="bg-black border-white/20 rounded-none text-white font-mono"
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
                                        CONFIRMAR ADIÇÃO
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Add Payment Dialog */}
                        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
                                    <DollarSign className="h-3 w-3 mr-2" /> REGISTRAR PAGAMENTO
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-black border border-white/20 rounded-none">
                                <DialogHeader>
                                    <DialogTitle className="text-white font-serif uppercase">REGISTRAR RECEBIMENTO</DialogTitle>
                                    <DialogDescription className="sr-only">
                                        Registre um pagamento recebido vinculado a um serviço específico.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={registerPayment} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">VINCULAR A SERVIÇO (OPCIONAL)</Label>
                                        <Select value={paymentServiceId} onValueChange={setPaymentServiceId}>
                                            <SelectTrigger className="bg-black border-white/20 rounded-none text-white font-mono uppercase">
                                                <SelectValue placeholder="GERAL (SEM VÍNCULO)" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-black border border-white/20 rounded-none text-white">
                                                <SelectItem value="none" className="font-mono uppercase focus:bg-white focus:text-black">GERAL (SEM VÍNCULO)</SelectItem>
                                                {projectServices.map(ps => (
                                                    <SelectItem key={ps.id} value={ps.id} className="font-mono uppercase focus:bg-white focus:text-black">
                                                        {ps.service?.name} (Rem: {Number((ps.total_price - ps.paid_amount) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">DESCRIÇÃO</Label>
                                        <Input
                                            value={paymentDescription}
                                            onChange={(e) => setPaymentDescription(e.target.value)}
                                            placeholder="Ex: Entrada, Parcela 1..."
                                            className="bg-black border-white/20 rounded-none text-white font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">VALOR DO PAGAMENTO (R$)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="bg-black border-white/20 rounded-none text-white font-mono"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
                                        REGISTRAR
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {projectServices.length === 0 ? (
                        <div className="p-12 text-center text-white/30 font-mono uppercase text-xs tracking-widest">
                            NENHUM SERVIÇO VINCULADO
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {projectServices.map((ps) => (
                                <div key={ps.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div>
                                        <p className="font-serif text-white uppercase text-sm mb-1">{ps.service?.name}</p>
                                        <div className="flex gap-4 text-[10px] text-white/50 font-mono uppercase tracking-widest">
                                            <span>QTD: {ps.quantity}</span>
                                            <span>UNIT: {Number(ps.unit_price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            <span>TOTAL: {Number(ps.total_price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-mono text-xs text-white uppercase">
                                                PAGO: {Number(ps.paid_amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                            {(ps.paid_amount || 0) < ps.total_price && (
                                                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                                                    PENDENTE: {Number((ps.total_price - ps.paid_amount) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeServiceFromProject(ps.id)}
                                            className="text-white/20 hover:text-white hover:bg-transparent rounded-none"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
