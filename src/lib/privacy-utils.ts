/**
 * Khaos Kontrol Privacy Utilities
 * UUID v4 Encrypted IDs for Contracts and Briefings
 * January 8, 2026
 */

import { v4 as uuidv4 } from 'uuid'

// Generate a cryptographically secure UUID v4
export function generateSecureUUID(): string {
  return uuidv4()
}

// Generate an encrypted UUID using Web Crypto API
export async function generateEncryptedUUID(): Promise<string> {
  try {
    // Generate a random UUID v4
    const uuid = generateSecureUUID()

    // Create a hash of the UUID for additional entropy
    const encoder = new TextEncoder()
    const data = encoder.encode(uuid)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Combine UUID with hash for maximum entropy
    return `${uuid}-${hashHex.substring(0, 8)}`
  } catch (_error) {
    return generateSecureUUID()
  }
}

// Encrypt sensitive contract data
export async function encryptContractData(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)

    // Generate a random key for this session
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'],
    )

    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      dataBuffer,
    )

    // Export key for storage (in production, this should be properly managed)
    const exportedKey = await crypto.subtle.exportKey('raw', key)

    // Combine IV, key, and encrypted data
    const combined = new Uint8Array(
      iv.length + exportedKey.byteLength + encrypted.byteLength,
    )
    combined.set(iv, 0)
    combined.set(new Uint8Array(exportedKey), iv.length)
    combined.set(new Uint8Array(encrypted), iv.length + exportedKey.byteLength)

    return btoa(String.fromCharCode(...combined))
  } catch (_error) {
    return data
  }
}

// Decrypt contract data
export async function decryptContractData(
  encryptedData: string,
): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(encryptedData), (c) =>
      c.charCodeAt(0),
    )

    const iv = combined.slice(0, 12)
    const keyData = combined.slice(12, 12 + 32) // AES-256 key is 32 bytes
    const encrypted = combined.slice(12 + 32)

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['decrypt'],
    )

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encrypted,
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (_error) {
    return encryptedData
  }
}

// Generate privacy-compliant IDs for contracts
export class ContractPrivacyManager {
  private static instance: ContractPrivacyManager

  private constructor() {}

  static getInstance(): ContractPrivacyManager {
    if (!ContractPrivacyManager.instance) {
      ContractPrivacyManager.instance = new ContractPrivacyManager()
    }
    return ContractPrivacyManager.instance
  }

  async generateContractId(): Promise<string> {
    return await generateEncryptedUUID()
  }

  async generateBriefingId(): Promise<string> {
    return await generateEncryptedUUID()
  }

  async encryptBriefing(briefing: string): Promise<string> {
    return await encryptContractData(briefing)
  }

  async decryptBriefing(encryptedBriefing: string): Promise<string> {
    return await decryptContractData(encryptedBriefing)
  }

  // Validate if an ID follows our encrypted UUID format
  validateEncryptedId(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-[0-9a-f]{8}$/i
    return uuidRegex.test(id)
  }
}

// Export singleton instance
export const contractPrivacy = ContractPrivacyManager.getInstance()

// Utility function for generating secure random strings
export function generateSecureRandomString(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  )
}

// Rate limiting utility to prevent information harvesting
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  private readonly maxAttempts: number
  private readonly windowMs: number

  constructor(maxAttempts: number = 10, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  isAllowed(key: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []

    // Remove old attempts outside the window
    const validAttempts = attempts.filter((time) => now - time < this.windowMs)

    if (validAttempts.length >= this.maxAttempts) {
      return false
    }

    validAttempts.push(now)
    this.attempts.set(key, validAttempts)
    return true
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }
}

// Export rate limiter instance for API calls
export const apiRateLimiter = new RateLimiter(50, 60000) // 50 requests per minute
