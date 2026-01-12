/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, ExternalLink, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCoordinatesChange?: (lat: number | null, lng: number | null) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  showMiniMap?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

// Singleton para carregar o script uma única vez
let googleMapsPromise: Promise<void> | null = null;
let cachedApiKey: string | null = null;

async function fetchApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;
  
  // Primeiro tenta a variável de ambiente
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (envKey) {
    cachedApiKey = envKey;
    return envKey;
  }
  
  // Se não existir, busca da edge function
  const { data, error } = await supabase.functions.invoke('get-maps-key');
  
  if (error || !data?.apiKey) {
    throw new Error("Google Maps API Key não configurada");
  }
  
  cachedApiKey = data.apiKey;
  return data.apiKey;
}

function loadGoogleMaps(): Promise<void> {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise(async (resolve, reject) => {
    try {
      // Check if already loaded
      if (window.google?.maps?.places) {
        resolve();
        return;
      }

      const apiKey = await fetchApiKey();
      
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Falha ao carregar Google Maps"));
      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });

  return googleMapsPromise;
}

// Gera URL do mapa estático com estilo minimalista/grayscale
function getStaticMapUrl(lat: number, lng: number, apiKey: string): string {
  const style = "&style=feature:all|element:geometry|color:0xf5f5f5&style=feature:all|element:labels.text.fill|color:0x616161&style=feature:all|element:labels.text.stroke|color:0xf5f5f5&style=feature:road|element:geometry|color:0xffffff&style=feature:water|element:geometry|color:0xe9e9e9";
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x150&scale=2&markers=color:0xB87A4F%7C${lat},${lng}${style}&key=${apiKey}`;
}

// Deep link para abrir no GPS nativo baseado no OS
function getGPSDeepLink(address: string, lat?: number | null, lng?: number | null): string {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  if (lat && lng) {
    if (isIOS) {
      // Apple Maps no iOS
      return `maps:///?daddr=${lat},${lng}&dirflg=d`;
    } else if (isAndroid) {
      // Google Maps no Android
      return `geo:${lat},${lng}?q=${lat},${lng}`;
    } else {
      // Desktop - Google Maps
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
  }

  // Fallback para endereço textual
  const encodedAddress = encodeURIComponent(address);
  if (isIOS) {
    return `maps:///?daddr=${encodedAddress}&dirflg=d`;
  } else if (isAndroid) {
    return `geo:0,0?q=${encodedAddress}`;
  } else {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  onCoordinatesChange,
  onFocus,
  onBlur,
  placeholder = "Digite o endereço...",
  className,
  showMiniMap = false,
  latitude,
  longitude,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [isSelected, setIsSelected] = useState(!!latitude && !!longitude);

  // Função auxiliar para fechar o PAC dropdown
  const closePacDropdown = useCallback(() => {
    // Método 1: Pressionar Escape
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
    });
    document.dispatchEvent(escapeEvent);
    
    // Método 2: Remover display do PAC container
    const pacContainer = document.querySelector('.pac-container');
    if (pacContainer) {
      (pacContainer as HTMLElement).style.display = 'none';
    }
    
    console.log('✅ PAC dropdown fechado via múltiplos métodos');
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      setCoords({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    loadGoogleMaps()
      .then(async () => {
        console.log('Google Maps carregado com sucesso');
        setIsApiLoaded(true);
        setIsLoading(false);
        // Guarda a API key para o mapa estático
        const key = await fetchApiKey();
        setApiKey(key);
      })
      .catch((err) => {
        console.warn("Google Maps não disponível:", err.message);
        setIsLoading(false);
      });
  }, []);

  const handlePlaceChanged = useCallback(() => {
    console.log('🔍 handlePlaceChanged chamado - iniciando processamento da seleção');
    
    if (!autocompleteRef.current) {
      console.warn('⚠️ Autocomplete reference não disponível');
      return;
    }

    const place = autocompleteRef.current.getPlace();
    console.log('📍 Place object recebido:', {
      formatted_address: place.formatted_address,
      has_geometry: !!place.geometry?.location,
      has_lat_lng: !!(place.geometry?.location?.lat && place.geometry?.location?.lng)
    });

    // STEP 1: Extrair endereço formatado
    const addressText = place.formatted_address || '';
    
    if (addressText) {
      console.log('✅ Atualizando address com:', addressText);
      // Force immediate state update
      onChange(addressText);
    } else {
      console.warn('⚠️ Nenhum endereço disponível');
    }

    // STEP 2: Extrair coordenadas
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      console.log('✅ Coordenadas extraídas:', { lat, lng });
      
      setCoords({ lat, lng });
      setIsSelected(true);
      onCoordinatesChange?.(lat, lng);
    } else {
      console.warn('⚠️ Geometria ou localização não disponível');
    }

    // STEP 3: Fechar o dropdown do autocomplete com força
    console.log('🔄 Fechando dropdown do autocomplete...');
    setTimeout(() => {
      // Remover foco do input para fechar o PAC
      if (inputRef.current) {
        inputRef.current.blur();
        console.log('✅ Input blur disparado');
      }
      
      // Fechar PAC via métodos robustos
      closePacDropdown();
    }, 50);
  }, [onChange, onCoordinatesChange, closePacDropdown]);

  useEffect(() => {
    if (!isApiLoaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "br" },
      fields: ["formatted_address", "geometry"],
    });

    autocomplete.addListener("place_changed", handlePlaceChanged);
    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isApiLoaded, handlePlaceChanged]);

  // CRITICAL: Prevent blur event when clicking on PAC suggestions
  // Use onMouseDown to intercept BEFORE the blur event fires
  useEffect(() => {
    const handlePacMouseDown = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const target = e.target as HTMLElement;
      const isPacContainer = target.closest('.pac-container') || 
                             target.classList.contains('pac-item') || 
                             target.closest('.pac-item') ||
                             target.closest('.pac-item-query') ||
                             target.closest('.pac-matched');
      
      if (isPacContainer) {
        console.log('🖱️ PAC item mousedown interceptado - prevenindo blur');
        // CRÍTICO: preventDefault impede que o input perca o foco
        mouseEvent.preventDefault();
        mouseEvent.stopPropagation();
        mouseEvent.stopImmediatePropagation();
      }
    };
    
    // IMPORTANT: Use capture phase on mousedown to intercept BEFORE blur
    // This must happen before the browser triggers the default blur behavior
    document.addEventListener('mousedown', handlePacMouseDown, true);
    
    return () => {
      document.removeEventListener('mousedown', handlePacMouseDown, true);
    };
  }, []);

  const handleOpenGPS = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (value) {
      const gpsUrl = getGPSDeepLink(value, coords?.lat, coords?.lng);
      window.open(gpsUrl, '_blank');
    }
  };

  const handleInputFocus = (e: React.FocusEvent) => {
    e.stopPropagation();
    onFocus?.();
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    e.stopPropagation();
    onBlur?.();
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🖱️ Input clicado, focando...');
  };

  // DEBUG: Log para monitorar mudanças no value prop
  useEffect(() => {
    console.log('📝 Address value prop alterado:', value);
  }, [value]);

  return (
    <div className={cn("space-y-4", className)} onClick={(e) => e.stopPropagation()}>
      {/* Minimalist Input - No borders, subtle background */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            console.log('✍️ Input onChange disparado:', newValue);
            onChange(newValue);
          }}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder={placeholder}
          className="bg-card/50 border-0 rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:ring-0 focus:border-0 focus:bg-card/70 transition-all duration-300"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground/60" />
        )}
      </div>

      {/* Elite Circular Map - Silver/Minimalist Style */}
      {coords && value && isSelected && (
        <div className="relative mx-auto">
          <div className="elite-map-container">
            {/* Map Background with Silver Gradient */}
            <div className="elite-map-bg">
              {/* Silver gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200/20 via-gray-100/10 to-slate-300/20 rounded-full"></div>

              {/* Minimalist grid lines */}
              <div className="absolute inset-0 rounded-full border border-slate-200/30"></div>
              <div className="absolute inset-2 rounded-full border border-slate-200/20"></div>
              <div className="absolute inset-4 rounded-full border border-slate-200/10"></div>

              {/* Center crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-8 bg-slate-300/50"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-px bg-slate-300/50"></div>

              {/* Location marker */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/30 animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border-2 border-primary/30 rounded-full animate-ping"></div>
              </div>
            </div>

            {/* Floating GPS Button */}
            <button
              type="button"
              onClick={handleOpenGPS}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 gps-button-elite"
              title="Iniciar Rota no GPS"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 group">
                <Navigation className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-200" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Fallback link if GPS fails */}
      {value && coords && isSelected && (
        <button
          type="button"
          onClick={handleOpenGPS}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex items-center gap-2 text-sm text-primary/80 hover:text-primary transition-colors mx-auto"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir no GPS
        </button>
      )}
    </div>
  );
}