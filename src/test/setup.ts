import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Supabase environment variables for tests
vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'dummy-key-for-tests')
