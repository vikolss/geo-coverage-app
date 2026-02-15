import { APIProvider, Map as GoogleMap, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useRef } from "react";
import {
  REGION_MAP_CONFIG,
  EUROPE_MAP_STYLES
} from "@/games/europe-coverage/constants";
import type { CityRecord, RegionKey } from "@/games/europe-coverage/types";

interface CoverageCirclesProps {
  guessedCities: CityRecord[];
  radiusKm: number;
}

function CoverageCircles({ guessedCities, radiusKm }: CoverageCirclesProps) {
  const map = useMap();
  const circlesRef = useRef<globalThis.Map<number, google.maps.Circle>>(
    new globalThis.Map()
  );

  useEffect(() => {
    return () => {
      for (const circle of circlesRef.current.values()) {
        circle.setMap(null);
      }
      circlesRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!map || typeof google === "undefined") return;

    const activeIds = new Set<number>();

    for (const city of guessedCities) {
      activeIds.add(city.id);
      const existing = circlesRef.current.get(city.id);

      if (existing) {
        existing.setMap(map);
        existing.setCenter({ lat: city.latitude, lng: city.longitude });
        existing.setRadius(radiusKm * 1000);
        continue;
      }

      const circle = new google.maps.Circle({
        center: { lat: city.latitude, lng: city.longitude },
        radius: radiusKm * 1000,
        strokeColor: "#1f6feb",
        strokeOpacity: 0.85,
        strokeWeight: 1,
        fillColor: "#58a6ff",
        fillOpacity: 0.2,
        map
      });

      circlesRef.current.set(city.id, circle);
    }

    for (const [cityId, circle] of circlesRef.current.entries()) {
      if (activeIds.has(cityId)) continue;
      circle.setMap(null);
      circlesRef.current.delete(cityId);
    }
  }, [map, guessedCities, radiusKm]);

  return null;
}

interface CoveredMarkersProps {
  coveredCities: CityRecord[];
  guessedCityIds: Set<number>;
  completedCountryCodes: Set<string>;
}

function markerIcon(isGuessed: boolean, isCountryComplete: boolean): google.maps.Symbol {
  let fillColor = "#7f91a4";
  if (isCountryComplete) {
    fillColor = isGuessed ? "#177245" : "#3fa36b";
  } else if (isGuessed) {
    fillColor = "#1357b0";
  }

  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor,
    fillOpacity: 0.95,
    strokeColor: "#ffffff",
    strokeOpacity: 0.8,
    strokeWeight: 1,
    scale: isGuessed ? 4.8 : 3.2
  };
}

interface MarkerEntry {
  marker: google.maps.Marker;
  guessed: boolean;
  complete: boolean;
}

function CoveredMarkers({
  coveredCities,
  guessedCityIds,
  completedCountryCodes
}: CoveredMarkersProps) {
  const map = useMap();
  const markersRef = useRef<globalThis.Map<number, MarkerEntry>>(new globalThis.Map());

  useEffect(() => {
    return () => {
      for (const entry of markersRef.current.values()) {
        entry.marker.setMap(null);
      }
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!map || typeof google === "undefined") return;

    const coveredById = new globalThis.Map<number, CityRecord>(
      coveredCities.map((city) => [city.id, city])
    );

    // Clear in O(n) when game resets.
    if (coveredById.size === 0 && markersRef.current.size > 0) {
      for (const entry of markersRef.current.values()) {
        entry.marker.setMap(null);
      }
      markersRef.current.clear();
      return;
    }

    for (const city of coveredCities) {
      const isGuessed = guessedCityIds.has(city.id);
      const isCountryComplete = completedCountryCodes.has(city.countryCode);
      const existing = markersRef.current.get(city.id);

      if (!existing) {
        const marker = new google.maps.Marker({
          position: { lat: city.latitude, lng: city.longitude },
          map,
          optimized: true,
          clickable: isGuessed,
          icon: markerIcon(isGuessed, isCountryComplete),
          zIndex: isGuessed ? 20 : 10,
          title: isGuessed ? city.name : undefined
        });

        markersRef.current.set(city.id, {
          marker,
          guessed: isGuessed,
          complete: isCountryComplete
        });
        continue;
      }

      existing.marker.setMap(map);

      if (existing.guessed !== isGuessed || existing.complete !== isCountryComplete) {
        existing.marker.setIcon(markerIcon(isGuessed, isCountryComplete));
        existing.marker.setZIndex(isGuessed ? 20 : 10);
        existing.marker.setTitle(isGuessed ? city.name : "");
        existing.marker.setClickable(isGuessed);
        existing.guessed = isGuessed;
        existing.complete = isCountryComplete;
      }
    }

    for (const [cityId, entry] of markersRef.current.entries()) {
      if (coveredById.has(cityId)) continue;
      entry.marker.setMap(null);
      markersRef.current.delete(cityId);
    }
  }, [map, coveredCities, guessedCityIds, completedCountryCodes]);

  return null;
}

interface EuropeMapProps {
  region: RegionKey;
  guessedCities: CityRecord[];
  coveredCities: CityRecord[];
  completedCountryCodes: Set<string>;
  radiusKm: number;
}

export function EuropeMap({
  region,
  guessedCities,
  coveredCities,
  completedCountryCodes,
  radiusKm
}: EuropeMapProps) {
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? import.meta.env.GOOGLE_MAPS_API_KEY ?? "";

  const guessedCityIds = useMemo(
    () => new Set(guessedCities.map((city) => city.id)),
    [guessedCities]
  );
  const mapConfig = REGION_MAP_CONFIG[region];

  if (!apiKey) {
    return (
      <div className="map-error card">
        <h3>Missing Google Maps API key</h3>
        <p>Set `VITE_GOOGLE_MAPS_API_KEY` (or `GOOGLE_MAPS_API_KEY`) in `.env`.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <GoogleMap
        key={region}
        defaultCenter={mapConfig.center}
        defaultZoom={mapConfig.defaultZoom}
        minZoom={mapConfig.minZoom}
        maxZoom={mapConfig.maxZoom}
        gestureHandling="greedy"
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        restriction={{ latLngBounds: mapConfig.bounds, strictBounds: false }}
        styles={EUROPE_MAP_STYLES}
      >
        <CoverageCircles guessedCities={guessedCities} radiusKm={radiusKm} />
        <CoveredMarkers
          coveredCities={coveredCities}
          guessedCityIds={guessedCityIds}
          completedCountryCodes={completedCountryCodes}
        />
      </GoogleMap>
    </APIProvider>
  );
}
