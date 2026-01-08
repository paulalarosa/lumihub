import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCoordinatesChange?: (lat: number | null, lng: number | null) => void;
  placeholder?: string;
  className?: string;
}

// Singleton para carregar o script uma única vez
let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (googleMapsPromise) return googleMapsPromise;
  
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API Key não configurada"));
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar Google Maps"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export function AddressAutocomplete({
  value,
  onChange,
  onCoordinatesChange,
  placeholder = "Digite o endereço...",
  className,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('Maps API Key exists:', !!apiKey);
    
    loadGoogleMaps()
      .then(() => {
        console.log('Maps Loaded: true');
        setIsApiLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log('Maps Loaded: false');
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
    
    if (place.geometry?.location && onCoordinatesChange) {
      onCoordinatesChange(
        place.geometry.location.lat(),
        place.geometry.location.lng()
      );
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

  return (
    <div className={cn("relative", className)}>
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
  );
}
