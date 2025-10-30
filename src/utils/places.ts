import type { SearchResult } from "@/types/location";

export async function getPlaceDetails(placeId: string): Promise<SearchResult | null> {
  if (!placeId) return null;

  if (!window.google?.maps?.places) {
    return null;
  }

  // Prefer modern Place API if available
  const PlaceCtor: any = (window as any).google?.maps?.places?.Place;
  if (PlaceCtor) {
    try {
      const place: any = new PlaceCtor({ id: placeId });
      // Request broad but safe set of fields; some environments may require different names
      await place.fetchFields({
        fields: [
          'id',
          'name',
          'displayName',
          'formattedAddress',
          'geometry',
          'location',
        ] as any,
      });

      const id: string = place.id || place.place_id || placeId;
      const name: string = (place.displayName && (place.displayName.text || String(place.displayName)))
        || place.name
        || '';
      const loc: any = place.location || place.geometry?.location;
      const lat = typeof loc?.lat === 'function' ? loc.lat() : loc?.lat;
      const lng = typeof loc?.lng === 'function' ? loc.lng() : loc?.lng;
      const address: string = place.formattedAddress || place.formatted_address || '';

      if (!id || lat == null || lng == null) return null;

      return {
        id,
        name,
        address,
        location: { lat, lng },
      };
    } catch (_e) {
      // Fall through to legacy service below
    }
  }

  // Legacy fallback for older libraries
  const mapDiv = document.createElement('div');
  const service = new window.google.maps.places.PlacesService(mapDiv);
  const request: google.maps.places.PlaceDetailsRequest = {
    placeId,
    fields: [
      'place_id',
      'name',
      'formatted_address',
      'geometry',
    ],
  };

  const details = await new Promise<google.maps.places.PlaceResult | null>((resolve) => {
    service.getDetails(request, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        resolve(place);
      } else {
        resolve(null);
      }
    });
  });

  if (!details?.place_id || !details.geometry?.location) return null;

  return {
    id: details.place_id,
    name: details.name || '',
    address: details.formatted_address || '',
    location: {
      lat: details.geometry.location.lat(),
      lng: details.geometry.location.lng(),
    },
  };
}


