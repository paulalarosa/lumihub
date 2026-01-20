import { supabase } from "@/integrations/supabase/client";
import { AuditService } from "./audit.service";

export const BackupService = {
    async generateEncryptedBackup(): Promise<void> {
        // 1. Fetch critical data
        // We use Promise.all to fetch concurrently
        const [profiles, contracts] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('contracts').select('*')
        ]);

        const backupData = {
            profiles: profiles.data || [],
            contracts: contracts.data || [],
            marketing: [], // Removed
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        // 2. Encrypt Data (Web Crypto API)
        const password = "admin-backup-secret-key-change-me"; // Ideally dynamic or user-prompted
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        const key = await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: enc.encode("lumi-hub-salt"),
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedContent = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            enc.encode(JSON.stringify(backupData))
        );

        // 3. Prepare Download
        // We combine IV and Content for portability
        const combinedBuffer = new Uint8Array(iv.length + encryptedContent.byteLength);
        combinedBuffer.set(iv);
        combinedBuffer.set(new Uint8Array(encryptedContent), iv.length);

        const blob = new Blob([combinedBuffer], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kontrol_backup_${new Date().toISOString().split('T')[0]}.enc`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // 4. Log Action
        await AuditService.logAction('BACKUP_GENERATED', {
            size_bytes: blob.size,
            includes: ['profiles', 'contracts', 'marketing']
        });
    }
};
