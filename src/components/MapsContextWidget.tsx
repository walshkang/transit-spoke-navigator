import { useMemo } from "react";
import { apiKeyManager } from "@/utils/apiKeyManager";

interface MapsContextWidgetProps {
  token: string;
  height?: number;
}

export default function MapsContextWidget({ token, height = 280 }: MapsContextWidgetProps) {
  const key = apiKeyManager.getGoogleMapsKey();

  const src = useMemo(() => {
    const base = "https://www.google.com/maps/embed/v1/context";
    const params = new URLSearchParams();
    if (key) params.set("key", key);
    // Try common token parameter names (subject to change by Google docs)
    params.set("googleMapsWidgetContextToken", token);
    return `${base}?${params.toString()}`;
  }, [token, key]);

  return (
    <div className="rounded-xl overflow-hidden border bg-muted/20">
      <iframe
        title="Google Maps Contextual Widget"
        src={src}
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}


