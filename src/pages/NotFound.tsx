import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-white selection:text-black">
      <div className="space-y-6 text-center max-w-md mx-auto fade-in animate-in duration-700">
        <h1 className="font-serif text-6xl md:text-8xl tracking-tight">404</h1>
        <div className="w-12 h-[1px] bg-white/20 mx-auto" />
        <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
          Página não encontrada
        </p>
        <div className="pt-8">
          <Link to="/dashboard">
            <Button
              variant="outline"
              className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest h-12 px-8 transition-all duration-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="fixed bottom-8 text-[10px] font-mono uppercase tracking-[0.3em] text-white/20">
        KONTROL
      </div>
    </div>
  )
}

export default NotFound
