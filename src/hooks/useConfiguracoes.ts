import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export function useConfiguracoes() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { toast } = useToast()

  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [businessName, setBusinessName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#ffffff')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [website, setWebsite] = useState('')
  const [bio, setBio] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')

  const [pixKeyType, setPixKeyType] = useState('')
  const [pixKey, setPixKey] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountType, setAccountType] = useState('')
  const [agency, setAgency] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [accountHolderDocument, setAccountHolderDocument] = useState('')
  const [digitalWalletType, setDigitalWalletType] = useState('')
  const [digitalWalletAccount, setDigitalWalletAccount] = useState('')
  const [preferredMethod, setPreferredMethod] = useState('pix')

  // AI BYOK Settings
  const [aiProvider, setAiProvider] = useState<string>('google')
  const [aiKey, setAiKey] = useState<string>('')
  const [aiModel, setAiModel] = useState<string>('gemini-1.5-pro')

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      fetchData()
      setFullName(user.user_metadata?.full_name || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchData = async () => {
    setLoadingData(true)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('business_name, bio, phone, avatar_url')
      .eq('id', user!.id)
      .maybeSingle()

    if (profileData) {
      setBusinessName(profileData.business_name || '')
      setPhone(profileData.phone || '')
      setBio(profileData.bio || '')
      setLogoUrl(profileData.avatar_url)
    }

    const { data: aiSettings } = await supabase
      .from('user_ai_settings')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle()

    if (aiSettings) {
      setAiProvider(aiSettings.provider || 'google')
      setAiKey(aiSettings.api_key || '')
      setAiModel(aiSettings.model_name || 'gemini-1.5-pro')
    }

    setLoadingData(false)
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const { error: settingsError } = await supabase
        .from('profiles')
        .update({
          business_name: businessName.trim() || null,
          phone: phone.trim() || null,
          bio: bio.trim() || null,
          avatar_url: logoUrl,
        })
        .eq('id', user!.id)

      if (settingsError) throw settingsError

      if (fullName !== user?.user_metadata?.full_name) {
        const { error: userError } = await supabase.auth.updateUser({
          data: { full_name: fullName },
        })
        if (userError) throw userError
      }

      const { error: aiError } = await supabase
        .from('user_ai_settings')
        .upsert({
          user_id: user!.id,
          provider: aiProvider,
          api_key: aiKey.trim() || null,
          model_name: aiModel.trim() || null,
        })

      if (aiError) throw aiError

      toast({
        title: 'Configurações salvas',
        description: 'Todas as alterações foram aplicadas.',
      })
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro ao salvar',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploadingLogo(true)
    try {
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      setLogoUrl(publicUrl)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro no upload',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  return {
    user,
    loading,
    loadingData,
    saving,
    uploadingLogo,
    businessName,
    setBusinessName,
    primaryColor,
    setPrimaryColor,
    phone,
    setPhone,
    instagram,
    setInstagram,
    website,
    setWebsite,
    bio,
    setBio,
    logoUrl,
    fullName,
    setFullName,
    pixKeyType,
    setPixKeyType,
    pixKey,
    setPixKey,
    bankName,
    setBankName,
    bankCode,
    setBankCode,
    accountType,
    setAccountType,
    agency,
    setAgency,
    accountNumber,
    setAccountNumber,
    accountHolderName,
    setAccountHolderName,
    accountHolderDocument,
    setAccountHolderDocument,
    digitalWalletType,
    setDigitalWalletType,
    digitalWalletAccount,
    setDigitalWalletAccount,
    preferredMethod,
    setPreferredMethod,
    aiProvider,
    setAiProvider,
    aiKey,
    setAiKey,
    aiModel,
    setAiModel,
    saveSettings,
    handleLogoUpload,
  }
}
