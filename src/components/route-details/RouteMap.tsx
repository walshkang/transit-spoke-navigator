import { useEffect, useRef } from "react";

interface RouteMapProps {
  isVisible: boolean;
  onMapLoad: (map: google.maps.Map) => void;
}

const RouteMap = ({ isVisible, onMapLoad }: RouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: 40.7128, lng: -74.0060 },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    onMapLoad(map);
  }, [isVisible, onMapLoad]);

  return (
    <div 
      ref={mapRef}
      style={{ height: '400px', width: '100%' }}
      className="bg-gray-100 rounded-md mb-4"
    />
  );
};

export default RouteMap;