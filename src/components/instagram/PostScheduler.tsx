import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Upload, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const PostScheduler = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [isOpen, setIsOpen] = useState(false);
    const [caption, setCaption] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [scheduledFor, setScheduledFor] = useState('');
    const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);

    // Mutation: Agendar post
    const scheduleMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id) throw new Error('Usuário não autenticado');

            // Upload de mídias
            const mediaUrls: string[] = [];

            for (const file of mediaFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `instagram-posts/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('public') // Assuming a public bucket exists or needs to be created
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('public').getPublicUrl(filePath);
                mediaUrls.push(data.publicUrl);
            }

            // Buscar conexão
            const { data: connection } = await supabase
                .from('instagram_connections')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!connection) throw new Error('Instagram não conectado');

            // Criar post agendado
            const finalCaption = caption + '\n\n' + hashtags.map(h => `#${h.replace('#', '')}`).join(' ');

            const { error } = await supabase.from('instagram_scheduled_posts').insert({
                user_id: user.id,
                instagram_connection_id: connection.id,
                caption: finalCaption,
                media_urls: mediaUrls,
                media_type: mediaFiles.length > 1 ? 'carousel' : 'image', // simplified logic
                hashtags,
                scheduled_for: new Date(scheduledFor).toISOString(),
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instagram-posts'] });
            setIsOpen(false);
            setCaption('');
            setMediaFiles([]);
            setHashtags([]);
            setScheduledFor('');
            toast.success('Post agendado com sucesso!');
        },
        onError: (error) => {
            console.error(error);
            toast.error('Erro ao agendar post: ' + error.message);
        }
    });

    // Gerar hashtags com IA
    const generateHashtags = async () => {
        setIsGeneratingHashtags(true);

        try {
            const { data, error } = await supabase.functions.invoke('instagram-generate-hashtags', {
                body: { caption, category: 'makeup' },
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            if (data.hashtags) {
                setHashtags(data.hashtags.slice(0, 30));
                toast.success('Hashtags geradas!');
            }
        } catch (error: any) {
            toast.error('Erro ao gerar hashtags: ' + error.message);
        } finally {
            setIsGeneratingHashtags(false);
        }
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Agendar Post
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="bg-neutral-900 border-neutral-800 max-w-2xl text-white">
                    <DialogHeader>
                        <DialogTitle>Agendar Publicação no Instagram</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Upload de mídia */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Fotos/Vídeos *</label>
                            <div className="grid grid-cols-4 gap-2">
                                {mediaFiles.map((file, idx) => (
                                    <div key={idx} className="relative aspect-square">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Mídia ${idx + 1}`}
                                            className="w-full h-full object-cover rounded"
                                        />
                                        <button
                                            onClick={() => setMediaFiles(mediaFiles.filter((_, i) => i !== idx))}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}

                                {mediaFiles.length < 10 && (
                                    <label className="aspect-square border-2 border-dashed border-neutral-700 rounded flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-neutral-800 transition-colors">
                                        <Upload className="w-6 h-6 text-neutral-500 mb-1" />
                                        <span className="text-xs text-neutral-500">Adicionar</span>
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            multiple
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                setMediaFiles([...mediaFiles, ...files].slice(0, 10));
                                            }}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                            <p className="text-xs text-neutral-400 mt-1">
                                {mediaFiles.length > 1 ? 'Carrossel' : 'Post único'} - Máximo 10 fotos/vídeos
                            </p>
                        </div>

                        {/* Legenda */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Legenda *</label>
                            <Textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                rows={5}
                                placeholder="Escreva uma legenda cativante..."
                                maxLength={2200}
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                            <p className="text-xs text-neutral-400 mt-1">
                                {caption.length}/2200 caracteres
                            </p>
                        </div>

                        {/* Hashtags */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white">Hashtags</label>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={generateHashtags}
                                    disabled={!caption || isGeneratingHashtags}
                                    className="bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-600"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    {isGeneratingHashtags ? 'Gerando...' : 'IA Gerar'}
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 p-3 bg-neutral-800 rounded min-h-[60px] border border-neutral-700">
                                {hashtags.map((tag, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="cursor-pointer bg-neutral-700 hover:bg-neutral-600 text-white"
                                        onClick={() => setHashtags(hashtags.filter((_, i) => i !== idx))}
                                    >
                                        #{tag.replace('#', '')} ×
                                    </Badge>
                                ))}
                            </div>

                            <Input
                                placeholder="Digite hashtag e pressione Enter"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const value = e.currentTarget.value.replace('#', '').trim();
                                        if (value && !hashtags.includes(value)) {
                                            setHashtags([...hashtags, value]);
                                            e.currentTarget.value = '';
                                        }
                                    }
                                }}
                                className="mt-2 bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>

                        {/* Data/hora */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">
                                Agendar para *
                            </label>
                            <Input
                                type="datetime-local"
                                value={scheduledFor}
                                onChange={(e) => setScheduledFor(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 mt-4">
                            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white">
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => scheduleMutation.mutate()}
                                disabled={!caption || mediaFiles.length === 0 || !scheduledFor || scheduleMutation.isPending}
                                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {scheduleMutation.isPending ? 'Agendando...' : 'Agendar Post'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
