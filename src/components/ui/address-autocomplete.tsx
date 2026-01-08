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

// Gera URL do mapa estático com estilo minimalista/grayscale
function getStaticMapUrl(lat: number, lng: number, apiKey: string): string {
  const style = "&style=feature:all|element:geometry|color:0xf5f5f5&style=feature:all|element:labels.text.fill|color:0x616161&style=feature:all|element:labels.text.stroke|color:0xf5f5f5&style=feature:road|element:geometry|color:0xffffff&style=feature:water|element:geometry|color:0xe9e9e9";
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x150&scale=2&markers=color:0xB87A4F%7C${lat},${lng}${style}&key=${apiKey}`;
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

  // CRITICAL: Prevent clicks on the autocomplete dropdown from propagating
  useEffect(() => {
    const handlePacInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.pac-container') || target.classList.contains('pac-item') || target.closest('.pac-item')) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };
    
    // Capture phase to intercept before any other handlers
    document.addEventListener('click', handlePacInteraction, true);
    document.addEventListener('mousedown', handlePacInteraction, true);
    document.addEventListener('mouseup', handlePacInteraction, true);
    document.addEventListener('touchstart', handlePacInteraction, true);
    document.addEventListener('touchend', handlePacInteraction, true);
    
    return () => {
      document.removeEventListener('click', handlePacInteraction, true);
      document.removeEventListener('mousedown', handlePacInteraction, true);
      document.removeEventListener('mouseup', handlePacInteraction, true);
      document.removeEventListener('touchstart', handlePacInteraction, true);
      document.removeEventListener('touchend', handlePacInteraction, true);
    };
  }, []);

  const handleOpenMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (value) {
      window.open(getMapsDeepLink(value, coords?.lat, coords?.lng), '_blank');
    }
  };

  // Stop propagation on input interactions to prevent closing modals
  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleInputFocus = (e: React.FocusEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={cn("space-y-3", className)} onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground pointer-events-none" />
        )}
      </div>

      {/* Mini Mapa - Minimalista/Grayscale */}
      {showMiniMap && coords && apiKey && value && (
        <button
          type="button"
          onClick={handleOpenMaps}
          onMouseDown={(e) => e.stopPropagation()}
          className="relative w-full h-[120px] rounded-xl overflow-hidden border border-border hover:border-primary transition-all duration-300 group shadow-soft"
        >
          <img
            src={getStaticMapUrl(coords.lat, coords.lng, apiKey)}
            alt="Localização no mapa"
            className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium shadow-medium">
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
          onMouseDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir no Google Maps
        </button>
      )}
    </div>
  );
}