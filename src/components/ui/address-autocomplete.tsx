import { useEffect, useState, useRef } from "react";
import { Loader2, Navigation, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCoordinatesChange?: (lat: number | null, lng: number | null) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  showMiniMap?: boolean; // Kept for API compatibility, though map might be removed if we don't have SDK
  latitude?: number | null;
  longitude?: number | null;
}

interface PlaceSuggestion {
  description: string;
  place_id: string;
}

// Simple debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
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
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(inputValue, 500);

  // Sync internal state if external value changes (and it's different from what we typed)
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (latitude && longitude) setCoords({ lat: latitude, lng: longitude });
  }, [latitude, longitude]);

  // Load Google Maps Script if not loaded
  useEffect(() => {
    if (!window.google && !document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
      const script = document.createElement("script");
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.error("VITE_GOOGLE_MAPS_API_KEY missing");
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const searchPlaces = async () => {
      // If empty or just selected (matched value), don't search
      if (!debouncedSearch || debouncedSearch === value) {
        setSuggestions([]);
        return;
      }

      // Check if Google Maps is loaded
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        // Wait retry? Or just let the script load... 
        // Ideally we wait for load event, but for debounce simple check is ok for now.
        return;
      }

      setLoading(true);
      try {
        const autocompleteService = new window.google.maps.places.AutocompleteService();

        autocompleteService.getPlacePredictions(
          { input: debouncedSearch, language: 'pt-BR', componentRestrictions: { country: 'br' } },
          (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(predictions);
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
            }
            setLoading(false);
          }
        );

      } catch (err) {
        console.error("Error fetching places (client-side):", err);
        setLoading(false);
      }
    };

    searchPlaces();
  }, [debouncedSearch, value]);


  // Handle selection
  const handleSelect = async (place: PlaceSuggestion) => {
    setInputValue(place.description);
    onChange(place.description);
    setShowSuggestions(false);

    // If we need details (lat/lng), we can us PlacesService
    // const placesService = new google.maps.places.PlacesService(document.createElement('div'));
    // placesService.getDetails({ placeId: place.place_id }, (result, status) => ...);
  };

  const handleOpenGPS = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value) {
      window.open(getGPSDeepLink(value, coords?.lat, coords?.lng), '_blank');
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative space-y-2", className)}>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            onFocus?.();
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={onBlur}
          placeholder={placeholder}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-none pr-10 focus-visible:ring-0 focus-visible:border-[#00e5ff]/50 transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-white/50" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-[9999] w-full bg-[#1A1A1A] border border-white/10 shadow-xl max-h-60 overflow-y-auto rounded-none top-full mt-1">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
            >
              <MapPin className="h-4 w-4 text-white/40 shrink-0" />
              <span>{suggestion.description}</span>
            </li>
          ))}
        </ul>
      )}

      {value && (
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
