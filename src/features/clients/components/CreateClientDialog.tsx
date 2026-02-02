import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUploader } from '@/components/ui/FileUploader';
import { useContractUpload } from '@/features/contracts/hooks/useContractUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, UserPlus } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
    phone: z.string().min(10, { message: "Phone number required." }),
});

export function CreateClientDialog() {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [contractUrl, setContractUrl] = useState<string | null>(null);
    const { uploadFile, isUploading } = useContractUpload();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) return;

        try {
            // 1. Create Client
            const { data: client, error } = await supabase
                .from('wedding_clients')
                .insert({
                    user_id: user.id,
                    name: values.name,
                    full_name: values.name,
                    email: values.email,
                    phone: values.phone,
                    status: 'lead',
                    wedding_date: new Date().toISOString(), // Temporary default
                    // contract_url: contractUrl // TODO: Add column to DB
                })
                .select()
                .single();

            if (error) throw error;

            toast.success("New client record created.");

            // 2. Alert upload URL if exists (as requested)
            if (contractUrl) {
                // In a real scenario, we would update the client record here
                // await supabase.from('wedding_clients').update({ contract_url: contractUrl }).eq('id', client.id);
                alert(`CONTRACT UPLOADED SUCCESSFULLY!\nURL: ${contractUrl}`);
            }

            setOpen(false);
            form.reset();
            setContractUrl(null);
            queryClient.invalidateQueries({ queryKey: ['clients'] });

        } catch (error) {
            console.error("Error creating client:", error);
            toast.error("Failed to create client record.");
        }
    };

    const handleFileUpload = async (file: File) => {
        // We pass the entered name as a prefix or just let the hook handle it
        // Ideally we would have the client ID, but here we upload FIRST (or in parallel)
        const url = await uploadFile(file);
        if (url) {
            setContractUrl(url);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="font-mono uppercase text-xs bg-black text-white hover:bg-gray-800 rounded-none h-9">
                    <UserPlus className="w-4 h-4 mr-2" />
                    New Client
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white border-2 border-black p-0 overflow-hidden gap-0 rounded-none w-full shadow-2xl">
                <div className="bg-black p-6 text-white text-center">
                    <DialogTitle className="font-serif text-2xl tracking-tight mb-2">NEW CLIENT RECORD</DialogTitle>
                    <DialogDescription className="text-white/60 font-mono text-xs uppercase tracking-wider">
                        Enter details & Attach Contract
                    </DialogDescription>
                </div>

                <div className="p-6 space-y-6">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="font-mono text-xs uppercase text-gray-500">Full Name</Label>
                            <Input
                                id="name"
                                {...form.register("name")}
                                className="rounded-none border-black focus-visible:ring-0 focus-visible:border-yellow-500 font-serif text-lg"
                                placeholder="e.g. Isabella Rossi"
                            />
                            {form.formState.errors.name && <p className="text-red-500 text-xs font-mono mt-1">{form.formState.errors.name.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="font-mono text-xs uppercase text-gray-500">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...form.register("email")}
                                    className="rounded-none border-gray-200 focus-visible:ring-0 focus-visible:border-black bg-gray-50"
                                    placeholder="client@mail.com"
                                />
                                {form.formState.errors.email && <p className="text-red-500 text-xs font-mono mt-1">{form.formState.errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="font-mono text-xs uppercase text-gray-500">Phone</Label>
                                <Input
                                    id="phone"
                                    {...form.register("phone")}
                                    className="rounded-none border-gray-200 focus-visible:ring-0 focus-visible:border-black bg-gray-50"
                                    placeholder="+55 11 99999-9999"
                                />
                                {form.formState.errors.phone && <p className="text-red-500 text-xs font-mono mt-1">{form.formState.errors.phone.message}</p>}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-dashed border-gray-200">
                            <Label className="font-mono text-xs uppercase text-black mb-3 block">Contract Document (Optional)</Label>
                            <FileUploader
                                onUpload={handleFileUpload}
                                isUploading={isUploading}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-black hover:bg-yellow-500 hover:text-black text-white font-mono uppercase tracking-wider h-12 rounded-none mt-4 transition-colors duration-200"
                            disabled={form.formState.isSubmitting || isUploading}
                        >
                            {form.formState.isSubmitting ? "PROCESSING..." : "CREATE RECORD"}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
