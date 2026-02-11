
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Image as ImageIcon, Upload, X, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AspectRatio } from "@/components/ui/aspect-ratio"

interface EventGalleryProps {
    eventId: string;
    readOnly?: boolean;
}

interface GalleryImage {
    name: string;
    url: string;
}

export function EventGallery({ eventId, readOnly = false }: EventGalleryProps) {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const bucketName = 'event-gallery'; // Using a dedicated bucket

    useEffect(() => {
        fetchImages();
    }, [eventId]);

    const fetchImages = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .storage
                .from(bucketName)
                .list(eventId, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' },
                });

            if (error) {
                // If bucket doesn't exist or other error
                console.error('Error fetching images:', error);
                return;
            }

            if (data) {
                const imageList = await Promise.all(
                    data.map(async (file) => {
                        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(`${eventId}/${file.name}`);
                        return {
                            name: file.name,
                            url: publicUrl
                        };
                    })
                );
                setImages(imageList);
            }
        } catch (error) {
            console.error('Error loading gallery:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${eventId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            toast({
                title: "Sucesso",
                description: "Imagem enviada com sucesso!",
            });

            await fetchImages();

        } catch (error) {
            console.error('Error uploading image:', error);
            toast({
                title: "Erro no upload",
                description: error.message || "Não foi possível enviar a imagem.",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (imageName: string) => {
        try {
            const { error } = await supabase.storage
                .from(bucketName)
                .remove([`${eventId}/${imageName}`]);

            if (error) throw error;

            setImages(images.filter(img => img.name !== imageName));
            toast({
                title: "Imagem removida",
            });

        } catch (error) {
            console.error('Error deleting image:', error);
            toast({
                title: "Erro ao excluir",
                description: "Não foi possível excluir a imagem.",
                variant: "destructive"
            });
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-gray-200">Galeria ({images.length})</h3>
                </div>

                {!readOnly && (
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            disabled={uploading}
                        />
                        <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-7" disabled={uploading}>
                            {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                            Upload
                        </Button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
                </div>
            ) : images.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-500">Nenhuma imagem na galeria</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {images.map((img) => (
                        <div key={img.name} className="relative group rounded-md overflow-hidden bg-black/40">
                            <AspectRatio ratio={1}>
                                <img
                                    src={img.url}
                                    alt="Gallery"
                                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                                />
                            </AspectRatio>

                            {!readOnly && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-6 w-6 rounded-full"
                                        onClick={() => handleDelete(img.name)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
