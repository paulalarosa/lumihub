import React, { useRef, useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
    onUpload: (file: File) => Promise<void>;
    isUploading?: boolean;
    accept?: string;
    label?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
    onUpload,
    isUploading = false,
    accept = "application/pdf",
    label = "DROP CONTRACT FILE // PDF ONLY"
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        if (file.type !== 'application/pdf') {
            alert('ONLY PDF FILES ARE ALLOWED');
            return;
        }
        setSelectedFile(file);
    };

    const handleConfirmUpload = async () => {
        if (selectedFile) {
            await onUpload(selectedFile);
            // Optionally clear file after success? Keeping it for now to show "Sent" state if needed, 
            // but usually valid to clear or show success state.
        }
    };

    const handleClear = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            <div
                className={cn(
                    "relative border-2 border-dashed border-black bg-gray-50 p-8 text-center transition-all duration-200",
                    dragActive && "bg-yellow-50 border-yellow-500",
                    isUploading && "opacity-50 pointer-events-none"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={accept}
                    onChange={handleChange}
                    disabled={isUploading}
                />

                {!selectedFile ? (
                    <div className="flex flex-col items-center gap-4 cursor-pointer">
                        <div className="bg-black text-white p-3 rounded-none">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div className="font-mono text-sm uppercase tracking-wider text-black/60">
                            {label}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-yellow-500 text-black p-3 rounded-none">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-black text-sm uppercase tracking-wide">
                                {selectedFile.name}
                            </span>
                            <span className="font-mono text-xs text-black/50">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </div>

                        <div className="flex gap-2 mt-2 w-full justify-center">
                            <Button
                                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                                variant="outline"
                                className="h-9 px-4 rounded-none border-black hover:bg-black hover:text-white uppercase font-mono text-xs"
                                disabled={isUploading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={(e) => { e.stopPropagation(); handleConfirmUpload(); }}
                                className="h-9 px-6 rounded-none bg-black text-white hover:bg-gray-800 uppercase font-mono text-xs"
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                        TRANSMITTING...
                                    </>
                                ) : (
                                    <>
                                        CONFIRM UPLOAD
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            {isUploading && (
                <div className="h-1 w-full bg-gray-200 mt-2 overflow-hidden">
                    <div className="h-full bg-black w-2/3 animate-[shimmer_1s_infinite_linear]" />
                </div>
            )}
        </div>
    );
};
