import { useCache } from "@/Context/Cache/CacheContext";
import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  Polyline,
  Autocomplete,
} from "@react-google-maps/api";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import polyline from "@mapbox/polyline";
import { Loader2, X, MapPin, Navigation, Car, Bus, CarTaxiFront, CloudRain, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import "./style.css"

const HotelDetails = ({ HotelDetailsPageRef }) => {
  const {
    selectedHotel,
    checkInDate,
    checkOutDate,
    adults,
    childrenCount,
    rooms,
  } = useCache();
  
  const {
    name,
    address,
    rating,
    price,
    city,
    location,
    photos,
    description,
    id,
  } = selectedHotel || {};
  
  const { lat, lng } = useParams();
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const navigate = useNavigate();

  // Existing states
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [imagesMap, setImagesMap] = useState(new Map());

  // New states for enhanced features
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("modes"); // "modes" or "routes"
  const [travelMode, setTravelMode] = useState("DRIVE");
  const [originLocation, setOriginLocation] = useState(null);
  const [originInput, setOriginInput] = useState("");
  const [pickingOnMap, setPickingOnMap] = useState(false);
  const [weather, setWeather] = useState(null);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [showingMainDestination, setShowingMainDestination] = useState(false);

  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);

  const routeColors = ["#1E90FF", "#32CD32", "#FF6347", "#FFD700", "#9370DB"];

  const containerStyle = {
    width: "100%",
    height: "400px",
  };

  const mapCenter = {
    lat: latitude || 0,
    lng: longitude || 0,
  };

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_API_KEY,
    libraries: ["places", "marker"],
  });

  // Fetch weather data
 // Fetch weather data
const fetchWeather = async (lat, lng) => {
  console.log("🌤️ Fetching weather for:", lat, lng);
  console.log("API Key exists:", !!import.meta.env.VITE_OPENWEATHER_API_KEY);
  
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}&units=metric`;
    console.log("Fetching from:", url.replace(import.meta.env.VITE_OPENWEATHER_API_KEY, 'API_KEY_HIDDEN'));
    
    const response = await fetch(url);
    console.log("Response status:", response.status);
    
    const data = await response.json();
    console.log("Weather response:", data);
    
    if (response.ok) {
      setWeather(data);
    } else {
      console.error("Weather API error:", data);
    }
  } catch (error) {
    console.error("Error fetching weather:", error);
  }
};


  useEffect(() => {
    if (latitude && longitude) {
      fetchWeather(latitude, longitude);
    }
  }, [latitude, longitude]);

  // Fetch nearby places (existing logic)
  useEffect(() => {
    const fetchNearbyPlaces = async () => {
      if (!latitude || !longitude) return;

      try {
        const placesRes = await fetch(
          `https://places.googleapis.com/v1/places:searchNearby?key=${import.meta.env.VITE_GOOGLE_MAP_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-FieldMask":
                "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.photos,places.googleMapsUri",
            },
            body: JSON.stringify({
              includedTypes: ["tourist_attraction"],
              maxResultCount: 20,
              locationRestriction: {
                circle: {
                  center: { latitude, longitude },
                  radius: 5000,
                },
              },
            }),
          }
        );

        const placesData = await placesRes.json();
        const formatted = (placesData.places || []).map((p) => ({
          id: p.id,
          name: p.displayName?.text,
          address: p.formattedAddress,
          rating: p.rating,
          price: p.priceLevel,
          location: p.location,
          photos: p.photos?.[0]?.name,
          googleMapsUri: p.googleMapsUri,
        }));

        setNearbyPlaces(formatted);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchNearbyPlaces();
  }, [latitude, longitude]);

  // Fetch routes with different travel modes [web:1][web:3]
  const fetchRoutesWithMode = async (origin, destination, mode) => {
    setLoadingRoutes(true);
    try {
      const response = await fetch(
        `https://routes.googleapis.com/directions/v2:computeRoutes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAP_API_KEY,
            "X-Goog-FieldMask":
              "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description,routes.travelAdvisory,routes.legs.steps.transitDetails,routes.legs.steps.staticDuration",
          },
          body: JSON.stringify({
            origin: {
              location: {
                latLng: {
                  latitude: origin.latitude,
                  longitude: origin.longitude,
                },
              },
            },
            destination: {
              location: {
                latLng: {
                  latitude: destination.latitude,
                  longitude: destination.longitude,
                },
              },
            },
            travelMode: mode,
            computeAlternativeRoutes: mode === "DRIVE",
            routingPreference: mode === "DRIVE" ? "TRAFFIC_AWARE" : undefined,
          }),
        }
      );

      const data = await response.json();
      setLoadingRoutes(false);

      if (data.routes && data.routes.length > 0) {
        return data.routes.map((route) => ({
          distanceMeters: route.distanceMeters,
          duration: route.duration,
          polyline: route.polyline,
          description: route.description || "Route",
          travelAdvisory: route.travelAdvisory,
          legs: route.legs,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error fetching routes:", error);
      setLoadingRoutes(false);
      return [];
    }
  };

  // Update routes when travel mode or origin changes
  // Update routes when travel mode or origin changes
// Update routes when travel mode or origin changes
useEffect(() => {
  // Determine the destination
  let destination = null;
  
  if (selectedPlace) {
    // If a nearby place is selected, use it as destination
    destination = {
      latitude: selectedPlace.location.latitude,
      longitude: selectedPlace.location.longitude,
    };
  } else if (showingMainDestination && latitude && longitude) {
    // If showing main destination (hotel), use hotel coordinates
    destination = {
      latitude: latitude,
      longitude: longitude,
    };
  }

  // Only fetch routes if we have a destination
  if (destination) {
    // Determine origin
    const origin = originLocation || { latitude, longitude };

    // Only fetch if origin is different from destination
    if (
      origin.latitude !== destination.latitude ||
      origin.longitude !== destination.longitude
    ) {
      fetchRoutesWithMode(origin, destination, travelMode).then(
        (fetchedRoutes) => {
          if (fetchedRoutes && fetchedRoutes.length > 0) {
            const processedRoutes = fetchedRoutes.map((route) => ({
              ...route,
              decodedPath: polyline
                .decode(route.polyline.encodedPolyline)
                .map(([lat, lng]) => ({
                  lat,
                  lng,
                })),
            }));
            setRoutes(processedRoutes);
            setSelectedRouteIndex(0);
          } else {
            setRoutes([]);
          }
        }
      );
    } else {
      // Origin and destination are the same
      setRoutes([]);
    }
  } else {
    setRoutes([]);
  }
}, [selectedPlace, travelMode, originLocation, showingMainDestination, latitude, longitude]);



  // Fetch images for places
  useEffect(() => {
    nearbyPlaces.forEach((place) => {
      const photoRef = place.photos;
      if (photoRef && !imagesMap.has(photoRef)) {
        fetchGooglePhotoUrl(photoRef).then((url) => {
          if (url) {
            setImagesMap((prev) => new Map(prev).set(photoRef, url));
          }
        });
      }
    });
  }, [nearbyPlaces]);

  const fetchGooglePhotoUrl = async (photoReference) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
      return `https://places.googleapis.com/v1/${photoReference}/media?maxWidthPx=800&key=${apiKey}`;
    } catch (err) {
      console.error("Error fetching photo URL:", err);
      return null;
    }
  };

  const getImage = (key) => imagesMap.get(key);

  const getTime = (value) => {
    const seconds = parseInt(value);
    return Math.ceil(seconds / 60);
  };

  const getDistance = (value) => {
    const meters = parseInt(value);
    return (meters / 1000).toFixed(2);
  };

  // Cost estimation functions
  const calculateCost = (distanceKm, mode) => {
    const distance = parseFloat(distanceKm);
    
    switch (mode) {
      case "DRIVE":
        const minCost = (distance * 6).toFixed(0);
        const maxCost = (distance * 8).toFixed(0);
        return `₹${minCost} - ₹${maxCost}`;
      
      case "TRANSIT":
        const transitCost = Math.max(10, distance * 2).toFixed(0);
        return `₹${transitCost} (approx)`;
      
      case "TAXI":
        const baseFare = 50;
        const perKmRate = 17.5;
        const taxiCost = (baseFare + distance * perKmRate).toFixed(0);
        const taxiMax = (baseFare + distance * 20).toFixed(0);
        return `₹${taxiCost} - ₹${taxiMax}`;
      
      default:
        return "N/A";
    }
  };

  // Get current location
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setOriginLocation({ latitude: lat, longitude: lng });
          setOriginInput("Current Location");
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please enable location services.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Handle place selection from autocomplete
  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setOriginLocation({ latitude: lat, longitude: lng });
        setOriginInput(place.formatted_address || place.name);
      }
    }
  };

  // Handle map click for picking origin
  const handleMapClick = (e) => {
    if (pickingOnMap) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setOriginLocation({ latitude: lat, longitude: lng });
      setOriginInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setPickingOnMap(false);
    }
  };

  // Handle hotel marker click to open side panel
 // Handle hotel marker click to open side panel
// Handle hotel marker click to open side panel
const handleHotelMarkerClick = () => {
  setSidePanelOpen(true);
  setSelectedPlace(null); // Clear any selected nearby place
  setShowingMainDestination(true); // Show routes to main hotel
};



 const handleSelectPlace = (place) => () => {
  setSelectedPlace(place);
  setSelectedRouteIndex(0);
  setSidePanelOpen(true);
  setShowingMainDestination(false); // Routes to nearby place
};


  const handleOpenGoogleMaps = (googleMapsUri) => (e) => {
    e.stopPropagation();
    if (googleMapsUri) {
      window.open(googleMapsUri, "_blank");
    }
  };

  const selectedRoute = routes[selectedRouteIndex];

  // Get best route suggestion
  const getBestRouteSuggestion = () => {
    if (routes.length === 0) return null;
    
    const fastest = routes.reduce((prev, current) => 
      parseInt(prev.duration) < parseInt(current.duration) ? prev : current
    );
    
    return routes.indexOf(fastest);
  };

  // Display transit details
const getTransitDetails = (route) => {
  if (!route.legs || !route.legs[0] || !route.legs[0].steps) return null;
  
  const transitSteps = route.legs[0].steps.filter(
    step => step.transitDetails
  );
  
  if (transitSteps.length === 0) return null;
  
  return (
    <div className="mt-3 space-y-2">
      <p className="font-semibold text-xs text-foreground/70">Transit Details:</p>
      {transitSteps.map((step, idx) => {
        const transit = step.transitDetails;
        const line = transit.transitLine;
        const vehicle = line.vehicle;
        
        return (
          <div key={idx} className="bg-foreground/5 rounded-md p-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {vehicle.type === "BUS" ? "🚌" : 
                 vehicle.type === "SUBWAY" ? "🚇" :
                 vehicle.type === "TRAIN" ? "🚆" :
                 vehicle.type === "TRAM" ? "🚊" : "🚍"}
              </span>
              <div className="flex-1">
                <p className="font-semibold">{line.nameShort || line.name}</p>
                <p className="text-foreground/60">
                  {transit.stopDetails.departureStop.name} → {transit.stopDetails.arrivalStop.name}
                </p>
                <p className="text-foreground/60">
                  {transit.stopCount} stops • {Math.ceil(parseInt(step.staticDuration) / 60)} min
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};


  // Weather warning
  // Weather display for all conditions
const getWeatherWarning = () => {
  if (!weather) return null;
  
  const condition = weather.weather?.[0]?.main;
  const description = weather.weather?.[0]?.description;
  const temp = Math.round(weather.main?.temp);
  
  // Different colors and messages for different conditions
  const weatherConfig = {
    Rain: {
      bg: "bg-blue-500/20",
      border: "border-blue-500",
      textColor: "text-blue-700",
      icon: "🌧️",
      message: "Rain detected. Consider carrying an umbrella."
    },
    Thunderstorm: {
      bg: "bg-yellow-500/20",
      border: "border-yellow-500",
      textColor: "text-yellow-700",
      icon: "⛈️",
      message: "Thunderstorm alert! Stay safe indoors."
    },
    Clouds: {
      bg: "bg-gray-500/20",
      border: "border-gray-500",
      textColor: "text-gray-700",
      icon: "☁️",
      message: "Cloudy weather. Pleasant conditions."
    },
    Clear: {
      bg: "bg-orange-500/20",
      border: "border-orange-500",
      textColor: "text-orange-700",
      icon: "☀️",
      message: "Clear skies! Great weather for travel."
    },
    Snow: {
      bg: "bg-cyan-500/20",
      border: "border-cyan-500",
      textColor: "text-cyan-700",
      icon: "❄️",
      message: "Snow conditions. Drive carefully."
    },
    Mist: {
      bg: "bg-slate-500/20",
      border: "border-slate-500",
      textColor: "text-slate-700",
      icon: "🌫️",
      message: "Misty conditions. Reduced visibility."
    },
    Haze: {
      bg: "bg-slate-500/20",
      border: "border-slate-500",
      textColor: "text-slate-700",
      icon: "🌫️",
      message: "Hazy weather. Reduced visibility."
    }
  };
  
  const config = weatherConfig[condition] || {
    bg: "bg-blue-500/20",
    border: "border-blue-500",
    textColor: "text-blue-700",
    icon: "🌤️",
    message: `${description || 'Current weather conditions'}.`
  };
  
  return (
    <div className={`${config.bg} border ${config.border} rounded-md p-3 flex items-start gap-2`}>
      <span className="text-2xl">{config.icon}</span>
      <div className="text-sm flex-1">
        <p className={`font-medium ${config.textColor}`}>
          {condition} - {temp}°C
        </p>
        <p className={`${config.textColor} opacity-90 capitalize`}>
          {description}
        </p>
        <p className={`${config.textColor} opacity-80 mt-1 text-xs`}>
          {config.message}
        </p>
      </div>
    </div>
  );
};


  // Add this temporarily to debug
useEffect(() => {
  if (weather) {
    console.log("Weather data:", weather);
    console.log("Weather condition:", weather.weather?.[0]?.main);
    console.log("Should show warning:", 
      weather.weather?.[0]?.main === "Rain" || 
      weather.weather?.[0]?.main === "Thunderstorm"
    );
  }
}, [weather]);


 const travelModeIcons = {
  DRIVE: <Car className="w-5 h-5" />,
  TRANSIT: <Bus className="w-5 h-5" />,
  TAXI: <CarTaxiFront className="w-5 h-5" />,
};


  const travelModeLabels = {
    DRIVE: "🚗 Driving",
    TRANSIT: "🚌 Public Transit",
    TAXI: "🚕 Taxi",
  };

  return (
    <div ref={HotelDetailsPageRef} className="main relative">
      {/* Existing hotel details section */}
      <div className="hotel-details mt-5">
        <div className="text text-center">
          <h2 className="text-3xl md:text-5xl mt-5 font-bold flex items-center justify-center">
            <span className="bg-gradient-to-b text-7xl from-blue-400 to-blue-700 bg-clip-text text-center text-transparent">
              {name}
            </span>
          </h2>
          📍
          <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent text-xl">
            {address}
          </span>
        </div>

        <div className="flex items-center justify-center py-2 gap-2 mt-2">
          <h3 className="location-info opacity-90 bg-foreground/20 px-2 md:px-4 flex items-center justify-center rounded-md text-center text-md font-medium tracking-tight text-primary/80 md:text-lg">
            💵 {price}
          </h3>
          <h3 className="location-info opacity-90 bg-foreground/20 px-2 md:px-4 flex items-center justify-center rounded-md text-center text-md font-medium tracking-tight text-primary/80 md:text-lg">
            ⭐ {rating} Stars
          </h3>
        </div>
      </div>

      {/* Map section */}
      <div className="map-location mt-5 w-full bg-gradient-to-b from-primary/90 to-primary/60 font-bold bg-clip-text text-transparent text-3xl text-center">
        Map Location
      </div>
      
      <div className="hotel-map rounded-lg m-4 md:m-2 overflow-hidden shadow-md flex flex-col gap-2 md:flex-row relative">
        {!isLoaded ? (
          <div className="flex items-center justify-center w-full h-[400px]">
            <span className="text-gray-500 animate-pulse">Loading Map...</span>
          </div>
        ) : (
          <GoogleMap
            ref={mapRef}
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={15}
            onClick={handleMapClick}
          >
            {/* Hotel marker */}
            <Marker
              position={{ lat: latitude, lng: longitude }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: "#000000",
                fillOpacity: 1,
                strokeWeight: 1,
                strokeColor: "#ffffff",
              }}
              label="🏨"
              onClick={handleHotelMarkerClick}
            />

            {/* Origin marker */}
            {originLocation && (
              <Marker
                position={{
                  lat: originLocation.latitude,
                  lng: originLocation.longitude,
                }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#00FF00",
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: "#ffffff",
                }}
                label="📍"
              />
            )}

            {/* Destination marker and routes */}
            {/* Destination marker and routes */}
{routes.length > 0 && (
  <>
    {/* Render all routes */}
    {routes.map((route, index) => (
      <Polyline
        key={index}
        path={route.decodedPath}
        options={{
          strokeColor: routeColors[index % routeColors.length],
          strokeOpacity: selectedRouteIndex === index ? 0.9 : 0.4,
          strokeWeight: selectedRouteIndex === index ? 5 : 3,
          zIndex: selectedRouteIndex === index ? 100 : 10,
        }}
        onClick={() => setSelectedRouteIndex(index)}
      />
    ))}
    
    {/* Show destination marker only if it's a nearby place (not main hotel) */}
    {selectedPlace && (
      <Marker
        position={{
          lat: selectedPlace.location.latitude,
          lng: selectedPlace.location.longitude,
        }}
        icon={{
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "black",
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: "#ffffff",
        }}
        label="🎯"
      />
    )}
  </>
)}

          </GoogleMap>
        )}
        
        {/* Picking on map indicator */}
        {pickingOnMap && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-10">
            Click on the map to set origin location
          </div>
        )}
      </div>

      {/* Side Panel */}
      {sidePanelOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidePanelOpen(false)}
          />
          
          {/* Side Panel Content */}
          <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-background border-l border-foreground/20 shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
            {/* Header */}
            <div className="sticky top-0 bg-background border-b border-foreground/20 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Route Options</h2>
              <button
                onClick={() => setSidePanelOpen(false)}
                className="p-2 hover:bg-foreground/10 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-foreground/20">
              <button
                onClick={() => setActiveTab("modes")}
                className={cn(
                  "flex-1 py-3 px-4 font-medium transition-colors",
                  activeTab === "modes"
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                )}
              >
                Travel Modes
              </button>
              <button
                onClick={() => setActiveTab("routes")}
                className={cn(
                  "flex-1 py-3 px-4 font-medium transition-colors",
                  activeTab === "routes"
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
                )}
              >
                Route Options
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Weather Warning */}
              {getWeatherWarning()}

              {activeTab === "modes" ? (
                <>
                  {/* From Location Section */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">From Location</h3>
                    
                    {isLoaded && (
                      <Autocomplete
                        onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                        onPlaceChanged={onPlaceChanged}
                      >
                        <input
                          type="text"
                          placeholder="Search for a location..."
                          value={originInput}
                          onChange={(e) => setOriginInput(e.target.value)}
                          className="w-full px-4 py-2 border border-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          style={{color:"black"}}
                        />
                      </Autocomplete>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleUseCurrentLocation}
                        variant="outline"
                        className="flex-1"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Current Location
                      </Button>
                      <Button
                        onClick={() => setPickingOnMap(!pickingOnMap)}
                        variant={pickingOnMap ? "default" : "outline"}
                        className="flex-1"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Pick on Map
                      </Button>
                    </div>

                    {originLocation && (
                      <p className="text-sm text-green-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Origin set: {originInput}
                      </p>
                    )}
                  </div>

                  {/* Travel Modes */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Select Travel Mode</h3>
                    
                   {["DRIVE", "TRANSIT", "TAXI"].map((mode) => (
  <button
    key={mode}
    onClick={() => setTravelMode(mode)}
    className={cn(
      "w-full p-4 rounded-lg border-2 transition-all text-left",
      travelMode === mode
        ? "border-primary bg-primary/10"
        : "border-foreground/20 hover:border-foreground/40"
    )}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {travelModeIcons[mode]}
        <span className="font-medium">{travelModeLabels[mode]}</span>
      </div>
      {travelMode === mode && (
        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}
    </div>
    
    {selectedRoute && travelMode === mode && (
      <div className="mt-3 space-y-1 text-sm text-foreground/70">
        <p>Distance: {getDistance(selectedRoute.distanceMeters)} km</p>
        <p>Duration: {getTime(selectedRoute.duration)} min</p>
        <p className="font-semibold text-foreground">
          Est. Cost: {calculateCost(getDistance(selectedRoute.distanceMeters), mode)}
        </p>
        
        {/* Show transit details for TRANSIT mode */}
        {mode === "TRANSIT" && getTransitDetails(selectedRoute)}
      </div>
    )}
  </button>
))}

                  </div>

                  {loadingRoutes && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="ml-2">Calculating routes...</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Route Options Tab */}
                  {routes.length > 0 ? (
                    <>
                      {/* Best Option Suggestion */}
                      {travelMode === "DRIVE" && (
                        <div className="bg-blue-500/20 border border-blue-500 rounded-md p-3 flex items-start gap-2">
                          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-700">Best Option Right Now</p>
                            <p className="text-blue-600">
                              Route {getBestRouteSuggestion() + 1} is the fastest option
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg">
                          Available Routes ({routes.length})
                        </h3>
                        
                        {routes.map((route, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedRouteIndex(index)}
                            className={cn(
                              "w-full p-4 rounded-lg border-2 transition-all text-left",
                              selectedRouteIndex === index
                                ? "border-primary bg-primary/10"
                                : "border-foreground/20 hover:border-foreground/40"
                            )}
                            style={{
                              borderLeftWidth: "6px",
                              borderLeftColor: routeColors[index % routeColors.length],
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">Route {index + 1}</span>
                              {index === getBestRouteSuggestion() && (
                                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                                  Fastest
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-1 text-sm text-foreground/70">
                              <p>📏 {getDistance(route.distanceMeters)} km</p>
                              <p>⏱️ {getTime(route.duration)} minutes</p>
                              <p className="font-semibold text-foreground">
                                💰 {calculateCost(getDistance(route.distanceMeters), travelMode)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-foreground/60">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Select a destination to see route options</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Existing nearby places section */}
      <div className="mt-4 w-full">
        <h2 className="nearby-places mt-5 w-full bg-gradient-to-b from-primary/90 to-primary/60 font-bold bg-clip-text text-transparent text-3xl text-center">
          Nearby Places
        </h2>
        {nearbyPlaces.length === 0 ? (
          <p className="text-sm text-gray-500 my-5 text-center">
            <Loader2 size={50} className="animate-spin w-full mt-5" />
            Loading nearby places...
          </p>
        ) : (
          <ul className="places-list space-y-2 grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 p-5 lg:grid-cols-4 mx-auto">
            {nearbyPlaces.map((place, index) => {
              const imageUrl = getImage(place?.photos);
              
              return (
                <div
                  onClick={handleSelectPlace(place)}
                  className="max-w-xs relative w-full group/card border border-foreground/20 rounded-lg overflow-hidden shadow-md cursor-pointer"
                  key={index}
                >
                  <div
                    className={cn(
                      "cursor-pointer overflow-hidden relative card h-72 rounded-md shadow-xl max-w-sm mx-auto flex flex-col justify-between p-4",
                      "bg-cover bg-center bg-gray-200"
                    )}
                    style={{
                      backgroundImage: imageUrl
                        ? `url(${imageUrl})`
                        : "url(/images/main_img_placeholder.jpg)",
                    }}
                  >
                    <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-background to-transparent z-0 pointer-events-none" />
                    <div className="absolute w-full h-full top-0 left-0 transition duration-300 group-hover/card:bg-background opacity-60"></div>
                    <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-background to-transparent z-0 pointer-events-none" />

                    <div className="flex flex-row items-center space-x-4 z-10">
                      <div className="flex flex-col">
                        <p className="font-normal text-base text-foreground relative z-10">
                          # {index + 1}
                        </p>
                        <p className="text-sm text-foreground/90">
                          Rating {place?.rating} ⭐
                        </p>
                      </div>
                    </div>
                    
                    <div className="text content">
                      <h1 className="font-bold text-xl md:text-2xl text-foreground relative z-10 line-clamp-2">
                        {place.name}
                      </h1>
                      <p className="font-normal text-sm text-foreground relative z-10 my-4 line-clamp-3">
                        {place.address}
                      </p>
                      {place.googleMapsUri && (
                        <button
                          onClick={handleOpenGoogleMaps(place.googleMapsUri)}
                          className="relative z-20 mt-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md transition-colors flex items-center gap-1"
                        >
                          📍 Open in Maps
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HotelDetails;



