/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from "react";
import { Loader2, Navigation, ExternalLink } from "lucide-react";
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

// Global Promise for loading the API
let googleMapsPromise: Promise<void> | null = null;
let cachedApiKey: string | null = null;

async function fetchApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (envKey) {
    cachedApiKey = envKey;
    return envKey;
  }
  const { data, error } = await supabase.functions.invoke('get-maps-key');
  if (error || !data?.apiKey) throw new Error("Google Maps API Key não configurada");
  cachedApiKey = data.apiKey;
  return data.apiKey;
}

function loadGoogleMaps(): Promise<void> {
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise(async (resolve, reject) => {
    try {
      if (window.google?.maps?.places?.PlaceAutocompleteElement) {
        resolve();
        return;
      }
      const apiKey = await fetchApiKey();
      const script = document.createElement("script");
      // Load 'places' library explicitly
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
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

// Deep link helper
function getGPSDeepLink(address: string, lat?: number | null, lng?: number | null): string {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  if (lat && lng) {
    if (isIOS) return `maps:///?daddr=${lat},${lng}&dirflg=d`;
    if (isAndroid) return `geo:${lat},${lng}?q=${lat},${lng}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  const encoded = encodeURIComponent(address);
  if (isIOS) return `maps:///?daddr=${encoded}&dirflg=d`;
  if (isAndroid) return `geo:0,0?q=${encoded}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
}

export function AddressAutocomplete({
  value,
  onChange,
  onCoordinatesChange,
  onFocus,
  onBlur,
  placeholder = "Digite o endereço...",
  className,
  latitude,
  longitude,
}: AddressAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );

  useEffect(() => {
    if (latitude && longitude) setCoords({ lat: latitude, lng: longitude });
  }, [latitude, longitude]);

  useEffect(() => {
    let autocompleteElement: any = null;

    loadGoogleMaps()
      .then(() => {
        setIsLoading(false);
        if (!containerRef.current) return;

        // Clean up previous instances if any (though strict mode might cause double init)
        containerRef.current.innerHTML = '';

        // Init V3 Element
        // @ts-ignore - TS might not know PlaceAutocompleteElement yet
        autocompleteElement = new google.maps.places.PlaceAutocompleteElement();

        // Configuration
        autocompleteElement.id = "pac-input";
        autocompleteElement.classList.add("lumi-autocomplete-input");
        // We can inject styles via class or direct style, but Shadow DOM limits specific internal styling.
        // We rely on CSS variables where supported or simple outer styling.

        containerRef.current.appendChild(autocompleteElement);

        // Pre-fill if value exists (V3 accepts name property? Or we just assume it's blank init)
        // autocompleteElement.value = value || ""; // Not standard prop on the element class directly?
        // Actually, strictly speaking, setting value programmatically on the element isn't always straightforward 
        // without accessing the internal input shadow part, but let's try standard attribute.
        // If not, we rely on user typing. 
        // NOTE: If creating a NEW record, it's empty. If editing, we might want to show text.
        // However, the V3 element is a search widget. Better to start empty or let user search?
        // For now, let's leave it managed by the widget.

        // Event Listener
        autocompleteElement.addEventListener("gmp-placeselect", async (e: any) => {
          const place = e.place;
          await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });

          const address = place.formattedAddress || place.displayName;
          const lat = place.location?.lat();
          const lng = place.location?.lng();

          if (address) {
            onChange(address);
            // Verify if we can update the internal input value or if it updates auto.
          }
          if (lat && lng) {
            setCoords({ lat, lng });
            onCoordinatesChange?.(lat, lng);
          }
        });

      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });

    return () => {
      // Cleanup
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []); // Run once on mount

  const handleOpenGPS = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value) {
      window.open(getGPSDeepLink(value, coords?.lat, coords?.lng), '_blank');
    }
  };

  return (
    <div className={cn("space-y-4 relative z-[9999]", className)}>
      {/* Container for V3 Element */}
      <div
        ref={containerRef}
        className="w-full noir-autocomplete-wrapper"
        style={{ minHeight: '50px' }}
      >
        {isLoading && <Loader2 className="animate-spin h-5 w-5 text-white absolute top-3 left-4" />}
      </div>

      {/* Style Injection for the Custom Element (Attempting to override Shadow DOM variables if possible or just outer) */}
      <style>{`
          .noir-autocomplete-wrapper gmp-place-autocomplete {
             --gmp-px-color-surface: #000;
             --gmp-px-color-on-surface: #fff;
             --gmp-px-color-surface-variant: #111;
             --gmp-px-color-on-surface-variant: #ccc;
             --gmp-px-color-primary: #fff;
             --gmp-px-font-family-base: 'DM Mono', monospace;
             border: 1px solid rgba(255,255,255,0.1);
          }
          /* Attempt to force z-index on the popover if exposed */
          .pac-container, .gmp-pac-container {
             z-index: 99999 !important;
             pointer-events: auto !important;
          }
        `}</style>

      {/* GPS Button / Mini Map Indicator */}
      {value && coords && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleOpenGPS}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
          >
            <Navigation className="h-3 w-3" />
            Abrir no GPS
          </button>
        </div>
      )}
    </div>
  );
}
