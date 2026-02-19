import type { AttachmentData, AttachmentMediaCategory } from "./attachments.types";
import {
    FileTextIcon,
    GlobeIcon,
    ImageIcon,
    Music2Icon,
    PaperclipIcon,
    VideoIcon,
} from "lucide-react";

export const mediaCategoryIcons: Record<AttachmentMediaCategory, typeof ImageIcon> = {
    audio: Music2Icon,
    document: FileTextIcon,
    image: ImageIcon,
    source: GlobeIcon,
    unknown: PaperclipIcon,
    video: VideoIcon,
};

export const getMediaCategory = (
    data: AttachmentData
): AttachmentMediaCategory => {
    if (data.type === "source-document") {
        return "source";
    }

    const mediaType = data.mediaType ?? "";

    if (mediaType.startsWith("image/")) {
        return "image";
    }
    if (mediaType.startsWith("video/")) {
        return "video";
    }
    if (mediaType.startsWith("audio/")) {
        return "audio";
    }
    if (mediaType.startsWith("application/") || mediaType.startsWith("text/")) {
        return "document";
    }

    return "unknown";
};

export const getAttachmentLabel = (data: AttachmentData): string => {
    if (data.type === "source-document") {
        return data.title || data.filename || "Source";
    }

    const category = getMediaCategory(data);
    return data.filename || (category === "image" ? "Image" : "Attachment");
};
