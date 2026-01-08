# Lumi - High-End Business Management Platform 2026

> **Elite Business Intelligence & Geo-Intelligence Platform**
> *Transforming business management with premium UI/UX, advanced security, and intelligent geo-features*

## 🌟 Overview

Lumi is a cutting-edge business management platform designed for 2026, featuring:

- **Glassmorphism UI/UX**: Premium visual design with 25px blur effects and luxury aesthetics
- **Geo-Intelligence**: Elite circular maps with GPS deep links for iOS/Android navigation
- **Advanced Security**: Comprehensive RLS policies preventing information harvesting
- **Encrypted UUIDs**: Cryptographically secure identifiers for all business data
- **Bento Grid Dashboard**: Adaptive luxury layout with magnetic hover effects
- **Real-time Data Visualization**: Recharts integration with minimal gradients
- **AI-Powered Features**: Intelligent assistant portal and automated workflows

## 🚀 Key Features

### Premium UI/UX (2026 Standard)
- Glassmorphism design with 25px backdrop blur
- Magnetic hover effects with Framer Motion
- Luxury typography (Cormorant Garamond + Inter)
- Adaptive Bento Grid dashboard layout
- Staggered animations and premium interactions

### Geo-Intelligence System
- Elite circular compass-style maps
- OS-detected GPS deep links (iOS/Android)
- Google Maps Places API integration
- Floating navigation buttons with metallic styling
- Address autocomplete with geo-coordinates

### Enterprise Security
- Row Level Security (RLS) on all tables
- Encrypted UUID v4 identifiers
- Web Crypto API encryption for sensitive data
- Rate limiting and audit logging
- Privacy-compliant data handling

### Business Intelligence
- Real-time financial charts with Recharts
- Revenue tracking and analytics
- Client management with encrypted IDs
- Project lifecycle management
- Assistant coordination system

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast development
- **Tailwind CSS** with custom animations
- **Framer Motion** for premium interactions
- **Recharts** for data visualization
- **shadcn/ui** component library

### Backend & Security
- **Supabase** with RLS policies
- **PostgreSQL** with encrypted constraints
- **Web Crypto API** for client-side encryption
- **UUID v4** with cryptographic hashing

### Integrations
- **Google Maps Places API** for geo-intelligence
- **Google Calendar API** for event synchronization
- **MercadoPago** for payment processing
- **AI Assistant** for intelligent automation

## 📁 Project Structure

```
lumihub/
├── src/
│   ├── components/
│   │   ├── ui/                    # Premium UI components
│   │   ├── agenda/               # Calendar & event management
│   │   ├── ai-assistant/         # AI-powered features
│   │   ├── dashboard/            # Bento grid dashboard
│   │   ├── layout/               # Navigation & layout
│   │   └── marketing/            # Marketing components
│   ├── hooks/                    # Custom React hooks
│   ├── integrations/             # External API integrations
│   │   └── supabase/             # Database client & types
│   ├── lib/
│   │   ├── privacy-utils.ts      # Security & encryption utilities
│   │   ├── calendar-utils.ts     # Calendar management
│   │   └── utils.ts              # General utilities
│   ├── pages/                    # Application pages
│   └── assets/                   # Static assets
├── supabase/
│   ├── migrations/               # Database migrations
│   ├── functions/                # Edge functions
│   └── config.toml               # Supabase configuration
└── public/                       # Public assets
```

## 🔐 Security Implementation

### Row Level Security (RLS)
All database tables are protected with comprehensive RLS policies:

```sql
-- Example: Clients table RLS
CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (auth.uid() = created_by);
```

### Encrypted UUIDs
All business entities use cryptographically secure UUIDs:

```typescript
// Generate encrypted contract ID
const encryptedId = await contractPrivacy.generateContractId();
// Result: "550e8400-e29b-41d4-a716-446655440000-a1b2c3d4"
```

### Data Encryption
Sensitive data is encrypted using Web Crypto API:

```typescript
// Encrypt briefing data
const encrypted = await contractPrivacy.encryptBriefing(briefing);
// Decrypt when needed
const decrypted = await contractPrivacy.decryptBriefing(encrypted);
```

## 🗺️ Geo-Intelligence Features

### Elite Circular Maps
Premium map rendering with compass-style design:

```css
.elite-map-container {
  border-radius: 50%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.1);
}
```

### GPS Deep Links
Universal navigation links for iOS/Android:

```typescript
const gpsLink = getGPSDeepLink(latitude, longitude);
// iOS: "maps:///?ll=lat,lng"
// Android: "geo:lat,lng"
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lumihub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Add your Supabase and Google Maps API keys
   ```

4. **Database setup**
   - Execute the security migration in Supabase SQL Editor:
   ```sql
   -- Run the contents of lumi-security-migration.sql
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Key Components

#### Privacy Utilities (`src/lib/privacy-utils.ts`)
```typescript
import { contractPrivacy } from '@/lib/privacy-utils';

// Generate secure IDs
const contractId = await contractPrivacy.generateContractId();

// Encrypt sensitive data
const encrypted = await contractPrivacy.encryptBriefing(data);
```

#### Address Autocomplete (`src/components/ui/address-autocomplete.tsx`)
```typescript
<AddressAutocomplete
  onPlaceSelect={(place) => {
    // Handle elite map rendering and GPS links
  }}
/>
```

#### Dashboard (`src/pages/Dashboard.tsx`)
```typescript
// Bento Grid with magnetic cards
<MagneticCard className="glass-card-lunar">
  <RevenueChart data={revenueData} />
</MagneticCard>
```

## 🔒 Security Migration

To apply the comprehensive security overhaul:

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Execute the contents of `lumi-security-migration.sql`
4. Verify RLS policies are active

This migration:
- Enables RLS on all tables
- Creates user-based access policies
- Adds encrypted UUID validation
- Implements audit logging
- Sets up rate limiting

## 🌐 Deployment

### Environment Variables
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Build Commands
```bash
npm run build          # Production build
npm run build:dev      # Development build
npm run preview        # Preview production build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

---

**Built with ❤️ for the future of business management**
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/bfeb0768-1287-4e1f-bc7f-dc2712207c13) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
