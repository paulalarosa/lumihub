import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { SignatureCanvas } from '@/features/contracts/components/SignatureCanvas'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Shield,
  CheckCircle,
  FileText,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SafeHTML } from '@/components/ui/SafeHTML'
type SignatureMethod = 'drawn' | 'typed'
type StepId = 'validation' | 'review' | 'sign' | 'complete'

interface SignerData {
  name: string
  email: string
  type: string
  role: string
  order: number
}

interface GeoData {
  latitude: number
  longitude: number
  accuracy: number
}

const STEPS: StepId[] = ['validation', 'review', 'sign', 'complete']
const STEP_LABELS = ['Dados', 'Revisão', 'Assinar', 'Concluído']

export default function SignContract() {
  const { requestId } = useParams<{ requestId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const queryClient = useQueryClient()

  const [step, setStep] = useState<StepId>('validation')
  const [signatureMethod, setSignatureMethod] =
    useState<SignatureMethod>('drawn')
  const [typedSignature, setTypedSignature] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signerCpf, setSignerCpf] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [geolocation, setGeolocation] = useState<GeoData | null>(null)
  const [deviceFingerprint, setDeviceFingerprint] = useState('')

  const {
    data: requestData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['signature-request', requestId, token],
    queryFn: async () => {
      const { data: validation, error: valError } = await supabase.rpc(
        'validate_signature_access_token',
        { p_signature_request_id: requestId, p_token: token },
      )

      if (valError) throw valError
      if (!validation.valid) throw new Error(validation.error)

      const { data: request, error: reqError } = await supabase
        .from('signature_requests')
        .select('*, contract:contracts(*)')
        .eq('id', requestId!)
        .single()

      if (reqError) throw reqError

      const signer = (request.signers as SignerData[]).find(
        (s: SignerData) => s.email === validation.signer_email,
      )

      return { ...request, signer, signer_email: validation.signer_email }
    },
    enabled: !!requestId && !!token,
  })

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
        },
        () => {},
      )
    }

    const fp = btoa(
      navigator.userAgent +
        navigator.language +
        screen.width +
        screen.height +
        new Date().getTimezoneOffset(),
    )
    setDeviceFingerprint(fp)
  }, [])

  useEffect(() => {
    if (requestData?.signer) {
      setSignerName(requestData.signer.name || '')
    }
  }, [requestData])

  const signMutation = useMutation({
    mutationFn: async (signatureData: string) => {
      const { data, error } = await supabase.functions.invoke(
        'process-signature',
        {
          body: {
            signature_request_id: requestId,
            token,
            signer_name: signerName,
            signer_cpf: signerCpf || null,
            signature_method: signatureMethod,
            signature_data: signatureData,
            geolocation,
            device_fingerprint: deviceFingerprint,
          },
        },
      )
      if (error) throw error
      if (data.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      setStep('complete')
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({
        queryKey: ['signature-request', requestId],
      })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Contrato assinado com sucesso!')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao processar assinatura')
    },
  })

  const handleSign = useCallback(
    (signatureData: string) => {
      if (!agreedToTerms) {
        toast.error('Você precisa concordar com os termos')
        return
      }
      if (!signerName) {
        toast.error('Digite seu nome completo')
        return
      }
      signMutation.mutate(signatureData)
    },
    [agreedToTerms, signerName, signMutation],
  )

  const handleTypedSignature = useCallback(() => {
    if (!typedSignature) {
      toast.error('Digite sua assinatura')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 200
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 600, 200)
    ctx.font = '48px "Brush Script MT", cursive'
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(typedSignature, 300, 100)

    const dataUrl = canvas.toDataURL('image/png')
    handleSign(dataUrl)
  }, [typedSignature, handleSign])

  const currentStepIdx = STEPS.indexOf(step)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Validando convite...</p>
        </div>
      </div>
    )
  }

  if (queryError || !requestData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-red-500/50 rounded-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Link Inválido</h1>
          <p className="text-neutral-400">
            Este link de assinatura é inválido ou expirou.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Assinatura Digital
          </h1>
          <p className="text-neutral-400">
            Você foi convidado a assinar:{' '}
            <span className="text-white font-semibold">
              {requestData.contract?.title}
            </span>
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
                    step === s
                      ? 'bg-purple-600 text-white'
                      : currentStepIdx > idx
                        ? 'bg-green-600 text-white'
                        : 'bg-neutral-800 text-neutral-400',
                  )}
                >
                  {idx + 1}
                </div>
                <span
                  className={cn(
                    'ml-1 text-xs hidden sm:inline',
                    step === s ? 'text-white' : 'text-neutral-500',
                  )}
                >
                  {STEP_LABELS[idx]}
                </span>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-8 sm:w-12 h-0.5 mx-2',
                      currentStepIdx > idx ? 'bg-green-600' : 'bg-neutral-800',
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
          {step === 'validation' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">
                Confirme seus Dados
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nome Completo *
                  </label>
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Seu nome como aparecerá no contrato"
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    CPF (opcional)
                  </label>
                  <Input
                    value={signerCpf}
                    onChange={(e) => setSignerCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                  <p className="text-xs text-neutral-400 mt-1">
                    Adiciona validade jurídica adicional
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <Input
                    value={requestData.signer_email}
                    disabled
                    className="bg-neutral-800/50 border-neutral-700 text-neutral-400"
                  />
                </div>
              </div>

              <Alert className="bg-blue-900/20 border-blue-500/30">
                <Shield className="w-4 h-4 text-blue-400" />
                <AlertDescription className="text-blue-300 text-sm">
                  Sua assinatura será registrada com validade jurídica conforme
                  Lei 14.063/2020
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => setStep('review')}
                disabled={!signerName}
                className="w-full bg-white text-black hover:bg-neutral-200 font-semibold"
              >
                Continuar
              </Button>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">
                Revisar Contrato
              </h2>

              <div className="bg-white rounded-lg p-6 max-h-96 overflow-y-auto">
                <SafeHTML html={requestData.contract?.content || ''} />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={agreedToTerms}
                  onCheckedChange={(checked: boolean) =>
                    setAgreedToTerms(checked)
                  }
                  id="terms"
                  className="mt-0.5"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-neutral-300 cursor-pointer"
                >
                  Li e concordo com os termos deste contrato. Entendo que minha
                  assinatura digital possui validade jurídica equivalente à
                  assinatura manuscrita.
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('validation')}
                  className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep('sign')}
                  disabled={!agreedToTerms}
                  className="flex-1 bg-white text-black hover:bg-neutral-200 font-semibold"
                >
                  Assinar Contrato
                </Button>
              </div>
            </div>
          )}

          {step === 'sign' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">
                Assine o Contrato
              </h2>

              <Tabs
                value={signatureMethod}
                onValueChange={(v: string) =>
                  setSignatureMethod(v as SignatureMethod)
                }
              >
                <TabsList className="w-full bg-neutral-800">
                  <TabsTrigger value="drawn" className="flex-1">
                    ✍️ Desenhar
                  </TabsTrigger>
                  <TabsTrigger value="typed" className="flex-1">
                    ⌨️ Digitar
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="drawn" className="mt-6">
                  <SignatureCanvas
                    onSave={handleSign}
                    onCancel={() => setStep('review')}
                  />
                </TabsContent>

                <TabsContent value="typed" className="mt-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Digite sua assinatura
                      </label>
                      <Input
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        placeholder="Seu nome completo"
                        className="text-2xl font-serif italic text-center bg-neutral-800 border-neutral-700 text-white h-16"
                      />
                    </div>

                    {typedSignature && (
                      <div className="bg-white rounded-lg p-8 text-center">
                        <p className="text-4xl font-serif italic text-black">
                          {typedSignature}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep('review')}
                        className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={handleTypedSignature}
                        disabled={!typedSignature || signMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700 font-semibold"
                      >
                        {signMutation.isPending
                          ? 'Processando...'
                          : 'Confirmar Assinatura'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Alert className="bg-neutral-800/50 border-neutral-700">
                <Shield className="w-4 h-4 text-neutral-400" />
                <AlertDescription>
                  <p className="text-neutral-300 text-sm">
                    Ao assinar, os seguintes dados serão registrados para
                    validação jurídica:
                  </p>
                  <ul className="text-neutral-400 text-xs mt-2 space-y-1">
                    <li>• Data e hora exata da assinatura</li>
                    <li>• Endereço IP</li>
                    <li>• Localização geográfica (se autorizada)</li>
                    <li>• Identificação do dispositivo</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Contrato Assinado!
                </h2>
                <p className="text-neutral-400">
                  Sua assinatura foi registrada com sucesso e possui validade
                  jurídica
                </p>
              </div>

              <Alert className="bg-green-900/20 border-green-500/30">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <AlertDescription className="text-green-300 text-sm">
                  Um certificado digital foi gerado para esta assinatura
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-neutral-800 rounded-lg p-4">
                  <p className="text-xs text-neutral-400 mb-1">Signatário</p>
                  <p className="text-white font-semibold">{signerName}</p>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4">
                  <p className="text-xs text-neutral-400 mb-1">Data/Hora</p>
                  <p className="text-white font-semibold">
                    {new Date().toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-neutral-600 text-xs font-mono uppercase tracking-wider">
            Khaos Kontrol — Assinatura Eletrônica Avançada — Lei 14.063/2020
          </p>
        </div>
      </div>
    </div>
  )
}
