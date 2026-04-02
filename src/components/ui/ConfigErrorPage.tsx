import React from 'react'

interface ConfigErrorPageProps {
  missing: string[]
}

const ConfigErrorPage: React.FC<ConfigErrorPageProps> = ({ missing }) => {
  return (
    <div
      style={{
        backgroundColor: '#050505',
        color: '#C0C0C0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          border: '1px solid #1A1A1A',
          padding: '40px',
          background: 'linear-gradient(135deg, #0A0A0A 0%, #050505 100%)',
          borderRadius: '8px',
        }}
      >
        <h1
          style={{
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '32px',
            color: '#FFFFFF',
          }}
        >
          Configuration Error
        </h1>
        <p
          style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}
        >
          O sistema não pôde ser iniciado porque as credenciais do Supabase não
          foram encontradas no ambiente de produção.
        </p>

        <div style={{ textAlign: 'left', marginBottom: '24px' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            Variáveis ausentes:
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '13px',
              color: '#FF4D4D',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {missing.map((v) => (
              <li key={v} style={{ marginBottom: '8px' }}>
                • {v}
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            height: '1px',
            backgroundColor: '#1A1A1A',
            marginBottom: '32px',
          }}
        />

        <p style={{ fontSize: '12px', color: '#888' }}>
          Verifique se o arquivo{' '}
          <code style={{ color: '#DDD' }}>.env.production</code> está correto ou
          se as variáveis estão configuradas na sua plataforma de deploy.
        </p>
      </div>

      <p
        style={{
          marginTop: '32px',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          opacity: 0.5,
        }}
      >
        Khaos Kontrol
      </p>
    </div>
  )
}

export default ConfigErrorPage
