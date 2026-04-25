import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import type { Contract } from '../types'
import { logger } from '@/services/logger'

interface LazyContractPdfButtonProps {
  contract: Contract
  fileName: string
  children: (state: { loading: boolean }) => ReactNode
}

/**
 * Substitui PDFDownloadLink do @react-pdf/renderer pra manter o chunk
 * de ~1.5MB fora do bundle de /contratos até a maquiadora clicar em
 * "Baixar PDF". Contrato só renderiza em memória no momento da geração.
 */
export function LazyContractPdfButton({
  contract,
  fileName,
  children,
}: LazyContractPdfButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const [{ pdf }, { ContractDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ContractDocument'),
      ])
      const blob = await pdf(<ContractDocument contract={contract} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Erro ao gerar PDF')
      logger.error(err, 'LazyContractPdfButton.handleClick')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={handleClick} role="button" tabIndex={0}>
      {children({ loading })}
    </div>
  )
}
