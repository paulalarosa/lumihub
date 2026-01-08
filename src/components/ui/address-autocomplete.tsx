import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCoordinatesChange?: (lat: number | null, lng: number | null) => void;
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

// Gera URL do mapa estático
function getStaticMapUrl(lat: number, lng: number, apiKey: string): string {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x150&scale=2&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
}

// Deep link para abrir no Google Maps
function getMapsDeepLink(address: string, lat?: number | null, lng?: number | null): string {
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function AddressAutocomplete({
  value,
  onChange,
  onCoordinatesChange,
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
    if (!autocompleteRef.current) return;
    
    const place = autocompleteRef.current.getPlace();
    
    if (place.formatted_address) {
      onChange(place.formatted_address);
    }
    
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setCoords({ lat, lng });
      onCoordinatesChange?.(lat, lng);
    }
  }, [onChange, onCoordinatesChange]);

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

  // Impede que cliques no dropdown do autocomplete fechem o modal
  useEffect(() => {
    const handlePacClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.pac-container')) {
        e.stopPropagation();
      }
    };
    
    document.addEventListener('click', handlePacClick, true);
    return () => document.removeEventListener('click', handlePacClick, true);
  }, []);

  const handleOpenMaps = () => {
    if (value) {
      window.open(getMapsDeepLink(value, coords?.lat, coords?.lng), '_blank');
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Mini Mapa */}
      {showMiniMap && coords && apiKey && value && (
        <button
          type="button"
          onClick={handleOpenMaps}
          className="relative w-full h-[120px] rounded-lg overflow-hidden border border-border hover:border-primary transition-colors group"
        >
          <img
            src={getStaticMapUrl(coords.lat, coords.lng, apiKey)}
            alt="Localização no mapa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-full px-3 py-1.5 flex items-center gap-2 text-sm font-medium">
              <ExternalLink className="h-4 w-4" />
              Abrir no Maps
            </div>
          </div>
        </button>
      )}

      {/* Link para abrir no Maps quando não há mapa */}
      {!showMiniMap && value && coords && (
        <button
          type="button"
          onClick={handleOpenMaps}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir no Google Maps
        </button>
      )}
    </div>
  );
}
