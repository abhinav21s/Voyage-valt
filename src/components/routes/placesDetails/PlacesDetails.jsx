// import { useCache } from "@/Context/Cache/CacheContext";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   GoogleMap,
//   Marker,
//   useJsApiLoader,
//   Polyline,
//   Autocomplete,
// } from "@react-google-maps/api";
// import { useNavigate, useParams } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import polyline from "@mapbox/polyline";
// import { Loader2, X, MapPin, Navigation, Car, Bus, CarTaxiFront, CloudRain, Clock } from "lucide-react";
// import { cn } from "@/lib/utils";

// // Define libraries OUTSIDE component
// const libraries = ["places", "marker"];

// const PlacesDetails = ({ PlaceDetailsPageRef }) => {
//   const { selectedPlace } = useCache();

//   const {
//     name,
//     address,
//     rating,
//     price,
//     city,
//     location,
//     photos,
//     description,
//     id,
//   } = selectedPlace || {};

//   const { lat, lng } = useParams();
//   const latitude = parseFloat(lat);
//   const longitude = parseFloat(lng);
//   const navigate = useNavigate();

//   // Existing states
//   const [nearbyLocation, setNearbyLocation] = useState([]);
//   const [selectedLocation, setSelectedLocation] = useState(null);
//   const [routes, setRoutes] = useState([]);
//   const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
//   const [imagesMap, setImagesMap] = useState(new Map());

//   // New states for enhanced features
//   const [sidePanelOpen, setSidePanelOpen] = useState(false);
//   const [activeTab, setActiveTab] = useState("modes");
//   const [travelMode, setTravelMode] = useState("DRIVE");
//   const [originLocation, setOriginLocation] = useState(null);
//   const [originInput, setOriginInput] = useState("");
//   const [pickingOnMap, setPickingOnMap] = useState(false);
//   const [weather, setWeather] = useState(null);
//   const [loadingRoutes, setLoadingRoutes] = useState(false);
//   const [showingMainDestination, setShowingMainDestination] = useState(false);
//   const [transitDetails, setTransitDetails] = useState(null);

//   const autocompleteRef = useRef(null);
//   const mapRef = useRef(null);

//   // Define selectedRoute BEFORE useEffects
//   const selectedRoute = routes[selectedRouteIndex];

//   const routeColors = ["#1E90FF", "#32CD32", "#FF6347", "#FFD700", "#9370DB"];

//   const containerStyle = {
//     width: "100%",
//     height: "400px",
//   };

//   const mapCenter = {
//     lat: latitude || 0,
//     lng: longitude || 0,
//   };

//   const { isLoaded } = useJsApiLoader({
//     googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_API_KEY,
//     libraries: libraries,
//   });

//   // Fetch weather data
//   const fetchWeather = async (lat, lng) => {
//     try {
//       const response = await fetch(
//         `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}&units=metric`
//       );
//       const data = await response.json();
//       setWeather(data);
//     } catch (error) {
//       console.error("Error fetching weather:", error);
//     }
//   };

//   useEffect(() => {
//     if (latitude && longitude) {
//       fetchWeather(latitude, longitude);
//     }
//   }, [latitude, longitude]);

//   // Calculate transit details once when route or mode changes
//   useEffect(() => {
//     if (travelMode === "TRANSIT" && selectedRoute) {
//       if (!selectedRoute?.legs?.[0]?.steps) {
//         setTransitDetails(null);
//         return;
//       }

//       const steps = selectedRoute.legs[0].steps;
//       const transitSteps = steps.filter(step => step.transitDetails);
      
//       if (transitSteps.length === 0) {
//         setTransitDetails("no-transit");
//       } else {
//         setTransitDetails(transitSteps);
//       }
//     } else {
//       setTransitDetails(null);
//     }
//   }, [travelMode, selectedRoute, selectedRouteIndex]);

//   // Fetch nearby locations
//   useEffect(() => {
//     const fetchNearbyPlaces = async () => {
//       if (!latitude || !longitude) return;

//       try {
//         const placesRes = await fetch(
//           `https://places.googleapis.com/v1/places:searchNearby?key=${import.meta.env.VITE_GOOGLE_MAP_API_KEY}`,
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               "X-Goog-FieldMask":
//                 "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.photos,places.googleMapsUri",
//             },
//             body: JSON.stringify({
//               includedTypes: ["hotel"],
//               maxResultCount: 20,
//               locationRestriction: {
//                 circle: {
//                   center: { latitude, longitude },
//                   radius: 3000,
//                 },
//               },
//             }),
//           }
//         );

//         const placesData = await placesRes.json();
//         const formatted = (placesData.places || []).map((p) => ({
//           id: p.id,
//           name: p.displayName?.text,
//           address: p.formattedAddress,
//           rating: p.rating,
//           price: p.priceLevel,
//           location: p.location,
//           photos: p.photos?.[0]?.name,
//           googleMapsUri: p.googleMapsUri,
//         }));

//         setNearbyLocation(formatted);
//       } catch (error) {
//         console.error("Error:", error);
//       }
//     };

//     fetchNearbyPlaces();
//   }, [latitude, longitude]);

//   // Fetch routes with different travel modes
//   const fetchRoutesWithMode = async (origin, destination, mode) => {
//     setLoadingRoutes(true);
//     try {
//       const response = await fetch(
//         `https://routes.googleapis.com/directions/v2:computeRoutes`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAP_API_KEY,
//             "X-Goog-FieldMask":
//               "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description,routes.legs.steps,routes.legs.steps.transitDetails",
//           },
//           body: JSON.stringify({
//             origin: {
//               location: {
//                 latLng: {
//                   latitude: origin.latitude,
//                   longitude: origin.longitude,
//                 },
//               },
//             },
//             destination: {
//               location: {
//                 latLng: {
//                   latitude: destination.latitude,
//                   longitude: destination.longitude,
//                 },
//               },
//             },
//             travelMode: mode,
//             computeAlternativeRoutes: mode === "DRIVE",
//             routingPreference: mode === "DRIVE" ? "TRAFFIC_AWARE" : undefined,
//           }),
//         }
//       );

//       const data = await response.json();
//       setLoadingRoutes(false);

//       if (data.routes && data.routes.length > 0) {
//         return data.routes.map((route) => ({
//           distanceMeters: route.distanceMeters,
//           duration: route.duration,
//           polyline: route.polyline,
//           description: route.description || "Route",
//           travelAdvisory: route.travelAdvisory,
//           legs: route.legs,
//         }));
//       }

//       return [];
//     } catch (error) {
//       console.error("Error fetching routes:", error);
//       setLoadingRoutes(false);
//       return [];
//     }
//   };

//   // Update routes when travel mode or origin changes
//   useEffect(() => {
//     let destination = null;

//     if (selectedLocation) {
//       destination = {
//         latitude: selectedLocation.location.latitude,
//         longitude: selectedLocation.location.longitude,
//       };
//     } else if (showingMainDestination && latitude && longitude) {
//       destination = {
//         latitude: latitude,
//         longitude: longitude,
//       };
//     }

//     if (destination) {
//       const origin = originLocation || { latitude, longitude };

//       if (
//         origin.latitude !== destination.latitude ||
//         origin.longitude !== destination.longitude
//       ) {
//         fetchRoutesWithMode(origin, destination, travelMode).then(
//           (fetchedRoutes) => {
//             if (fetchedRoutes && fetchedRoutes.length > 0) {
//               const processedRoutes = fetchedRoutes.map((route) => ({
//                 ...route,
//                 decodedPath: polyline
//                   .decode(route.polyline.encodedPolyline)
//                   .map(([lat, lng]) => ({
//                     lat,
//                     lng,
//                   })),
//               }));
//               setRoutes(processedRoutes);
//               setSelectedRouteIndex(0);
//             } else {
//               setRoutes([]);
//             }
//           }
//         );
//       } else {
//         setRoutes([]);
//       }
//     } else {
//       setRoutes([]);
//     }
//   }, [selectedLocation, travelMode, originLocation, showingMainDestination, latitude, longitude]);

//   // Fetch images for locations
//   useEffect(() => {
//     nearbyLocation.forEach((location) => {
//       const photoRef = location.photos;
//       if (photoRef && !imagesMap.has(photoRef)) {
//         fetchGooglePhotoUrl(photoRef).then((url) => {
//           if (url) {
//             setImagesMap((prev) => new Map(prev).set(photoRef, url));
//           }
//         });
//       }
//     });
//   }, [nearbyLocation]);

//   const fetchGooglePhotoUrl = async (photoReference) => {
//     try {
//       const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
//       return `https://places.googleapis.com/v1/${photoReference}/media?maxWidthPx=800&key=${apiKey}`;
//     } catch (err) {
//       console.error("Error fetching photo URL:", err);
//       return null;
//     }
//   };

//   const getImage = (key) => imagesMap.get(key);

//   const getTime = (value) => {
//     const seconds = parseInt(value);
//     return Math.ceil(seconds / 60);
//   };

//   const getDistance = (value) => {
//     const meters = parseInt(value);
//     return (meters / 1000).toFixed(2);
//   };

//   const calculateCost = (distanceKm, mode) => {
//     const distance = parseFloat(distanceKm);

//     switch (mode) {
//       case "DRIVE":
//         const minCost = (distance * 6).toFixed(0);
//         const maxCost = (distance * 8).toFixed(0);
//         return `₹${minCost} - ₹${maxCost}`;

//       case "TRANSIT":
//         const transitCost = Math.max(10, distance * 2).toFixed(0);
//         return `₹${transitCost} (approx)`;

//       case "TAXI":
//         const baseFare = 50;
//         const perKmRate = 17.5;
//         const taxiCost = (baseFare + distance * perKmRate).toFixed(0);
//         const taxiMax = (baseFare + distance * 20).toFixed(0);
//         return `₹${taxiCost} - ₹${taxiMax}`;

//       default:
//         return "N/A";
//     }
//   };

//   const handleUseCurrentLocation = () => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude: lat, longitude: lng } = position.coords;
//           setOriginLocation({ latitude: lat, longitude: lng });
//           setOriginInput("Current Location");
//         },
//         (error) => {
//           console.error("Error getting location:", error);
//           alert("Unable to get your location. Please enable location services.");
//         }
//       );
//     } else {
//       alert("Geolocation is not supported by your browser.");
//     }
//   };

//   const onPlaceChanged = () => {
//     if (autocompleteRef.current) {
//       const place = autocompleteRef.current.getPlace();
//       if (place.geometry) {
//         const lat = place.geometry.location.lat();
//         const lng = place.geometry.location.lng();
//         setOriginLocation({ latitude: lat, longitude: lng });
//         setOriginInput(place.formatted_address || place.name);
//       }
//     }
//   };

//   const handleMapClick = (e) => {
//     if (pickingOnMap) {
//       const lat = e.latLng.lat();
//       const lng = e.latLng.lng();
//       setOriginLocation({ latitude: lat, longitude: lng });
//       setOriginInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
//       setPickingOnMap(false);
//     }
//   };

//   const handlePlaceMarkerClick = () => {
//     setSidePanelOpen(true);
//     setSelectedLocation(null);
//     setShowingMainDestination(true);
//   };

//   const handleSelectLocation = (location) => () => {
//     setSelectedLocation(location);
//     setSelectedRouteIndex(0);
//     setSidePanelOpen(true);
//     setShowingMainDestination(false);
//   };

//   const handleOpenGoogleMaps = (googleMapsUri) => (e) => {
//     e.stopPropagation();
//     if (googleMapsUri) {
//       window.open(googleMapsUri, "_blank");
//     }
//   };

//   const getBestRouteSuggestion = () => {
//     if (routes.length === 0) return null;

//     const fastest = routes.reduce((prev, current) =>
//       parseInt(prev.duration) < parseInt(current.duration) ? prev : current
//     );

//     return routes.indexOf(fastest);
//   };

//   // Weather display for all conditions
//   const getWeatherWarning = () => {
//     if (!weather) return null;

//     const condition = weather.weather?.[0]?.main;
//     const description = weather.weather?.[0]?.description;
//     const temp = Math.round(weather.main?.temp);

//     const weatherConfig = {
//       Rain: {
//         bg: "bg-blue-500/20",
//         border: "border-blue-500",
//         textColor: "text-blue-700",
//         icon: "🌧️",
//         message: "Rain detected. Consider carrying an umbrella."
//       },
//       Thunderstorm: {
//         bg: "bg-yellow-500/20",
//         border: "border-yellow-500",
//         textColor: "text-yellow-700",
//         icon: "⛈️",
//         message: "Thunderstorm alert! Stay safe indoors."
//       },
//       Clouds: {
//         bg: "bg-gray-500/20",
//         border: "border-gray-500",
//         textColor: "text-gray-700",
//         icon: "☁️",
//         message: "Cloudy weather. Pleasant conditions."
//       },
//       Clear: {
//         bg: "bg-orange-500/20",
//         border: "border-orange-500",
//         textColor: "text-orange-700",
//         icon: "☀️",
//         message: "Clear skies! Great weather for travel."
//       },
//       Snow: {
//         bg: "bg-cyan-500/20",
//         border: "border-cyan-500",
//         textColor: "text-cyan-700",
//         icon: "❄️",
//         message: "Snow conditions. Drive carefully."
//       },
//       Mist: {
//         bg: "bg-slate-500/20",
//         border: "border-slate-500",
//         textColor: "text-slate-700",
//         icon: "🌫️",
//         message: "Misty conditions. Reduced visibility."
//       },
//       Haze: {
//         bg: "bg-slate-500/20",
//         border: "border-slate-500",
//         textColor: "text-slate-700",
//         icon: "🌫️",
//         message: "Hazy weather. Reduced visibility."
//       }
//     };

//     const config = weatherConfig[condition] || {
//       bg: "bg-blue-500/20",
//       border: "border-blue-500",
//       textColor: "text-blue-700",
//       icon: "🌤️",
//       message: `${description || 'Current weather conditions'}.`
//     };

//     return (
//       <div className={`${config.bg} border ${config.border} rounded-md p-3 flex items-start gap-2`}>
//         <span className="text-2xl">{config.icon}</span>
//         <div className="text-sm flex-1">
//           <p className={`font-medium ${config.textColor}`}>
//             {condition} - {temp}°C
//           </p>
//           <p className={`${config.textColor} opacity-90 capitalize`}>
//             {description}
//           </p>
//           <p className={`${config.textColor} opacity-80 mt-1 text-xs`}>
//             {config.message}
//           </p>
//         </div>
//       </div>
//     );
//   };

//   // Render transit details from cached state
//   const renderTransitDetails = () => {
//     if (!transitDetails) return null;

//     if (transitDetails === "no-transit") {
//       return (
//         <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-xs">
//           <p className="font-semibold text-red-700 mb-1">🚫 No Public Transit Available</p>
//           <p className="text-red-600">
//             This route doesn't have bus or train service.
//           </p>
//           <p className="text-red-600 mt-2 text-[10px]">
//             💡 Try DRIVE or TAXI mode instead.
//           </p>
//         </div>
//       );
//     }

//     const getVehicleIcon = (type) => {
//       const icons = {
//         BUS: "🚌", SUBWAY: "🚇", TRAIN: "🚆", TRAM: "🚊",
//         RAIL: "🚆", METRO_RAIL: "🚇", HEAVY_RAIL: "🚆", COMMUTER_TRAIN: "🚆",
//       };
//       return icons[type] || "🚍";
//     };

//     return (
//       <div className="mt-3 space-y-2">
//         <p className="font-semibold text-xs text-green-700">
//           ✅ Transit Route ({transitDetails.length} {transitDetails.length === 1 ? 'segment' : 'segments'}):
//         </p>
//         {transitDetails.map((step, idx) => {
//           const transit = step.transitDetails;
//           if (!transit) return null;
          
//           const line = transit.transitLine || {};
//           const vehicle = line.vehicle || {};
//           const stopDetails = transit.stopDetails || {};
//           const departureStop = stopDetails.departureStop || {};
//           const arrivalStop = stopDetails.arrivalStop || {};

//           return (
//             <div key={idx} className="bg-green-500/5 border border-green-500/20 rounded-md p-3 text-xs space-y-1">
//               <div className="flex items-start gap-2">
//                 <span className="text-2xl">{getVehicleIcon(vehicle.type)}</span>
//                 <div className="flex-1">
//                   <p className="font-bold text-sm text-foreground">
//                     {line.nameShort || line.name || `${vehicle.type || 'Transit'}`}
//                   </p>
                  
//                   {vehicle.type && (
//                     <p className="text-foreground/60 capitalize">
//                       {vehicle.type.toLowerCase().replace('_', ' ')}
//                     </p>
//                   )}
                  
//                   {transit.headsign && (
//                     <p className="text-foreground/70 italic text-xs">→ {transit.headsign}</p>
//                   )}
                  
//                   <div className="mt-2 space-y-1">
//                     <p className="text-foreground/80">
//                       <span className="font-semibold">From:</span> {departureStop.name || 'N/A'}
//                     </p>
//                     <p className="text-foreground/80">
//                       <span className="font-semibold">To:</span> {arrivalStop.name || 'N/A'}
//                     </p>
//                   </div>
                  
//                   <div className="mt-2 flex gap-3 text-foreground/60">
//                     {transit.stopCount && <span>🛑 {transit.stopCount} stops</span>}
//                     {step.staticDuration && (
//                       <span>⏱️ {Math.ceil(parseInt(step.staticDuration.replace('s', '')) / 60)} min</span>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   const travelModeIcons = {
//     DRIVE: <Car className="w-5 h-5" />,
//     TRANSIT: <Bus className="w-5 h-5" />,
//     TAXI: <CarTaxiFront className="w-5 h-5" />,
//   };

//   const travelModeLabels = {
//     DRIVE: "🚗 Driving",
//     TRANSIT: "🚌 Public Transit",
//     TAXI: "🚕 Taxi",
//   };

//   return (
//     <div ref={PlaceDetailsPageRef} className="main relative">
//       <div className="place-details mt-5">
//         <div className="text text-center">
//           <h2 className="text-3xl md:text-5xl mt-5 font-bold flex items-center justify-center">
//             <span className="bg-gradient-to-b text-7xl from-blue-400 to-blue-700 bg-clip-text text-center text-transparent">
//               {name}
//             </span>
//           </h2>
//           📍
//           <span className="bg-gradient-to-b from-primary/90 to-primary/60 bg-clip-text text-transparent text-xl">
//             {address}
//           </span>
//         </div>

//         <div className="flex items-center justify-center py-2 gap-2 mt-2">
//           <h3 className="location-info opacity-90 bg-foreground/20 px-2 md:px-4 flex items-center justify-center rounded-md text-center text-md font-medium tracking-tight text-primary/80 md:text-lg">
//             💵 {price}
//           </h3>
//           <h3 className="location-info opacity-90 bg-foreground/20 px-2 md:px-4 flex items-center justify-center rounded-md text-center text-md font-medium tracking-tight text-primary/80 md:text-lg">
//             ⭐ {rating} Stars
//           </h3>
//         </div>
//       </div>

//       <div className="map-location-place mt-5 w-full bg-gradient-to-b from-primary/90 to-primary/60 font-bold bg-clip-text text-transparent text-3xl text-center">
//         Map Location
//       </div>

//       <div className="place-map rounded-lg m-4 md:m-2 overflow-hidden shadow-md flex flex-col gap-2 md:flex-row relative">
//         {!isLoaded ? (
//           <div className="flex items-center justify-center w-full h-[400px]">
//             <span className="text-gray-500 animate-pulse">Loading Map...</span>
//           </div>
//         ) : (
//           <GoogleMap
//             ref={mapRef}
//             mapContainerStyle={containerStyle}
//             center={mapCenter}
//             zoom={15}
//             onClick={handleMapClick}
//           >
//             <Marker
//               position={{ lat: latitude, lng: longitude }}
//               icon={{
//                 path: window.google.maps.SymbolPath.CIRCLE,
//                 scale: 12,
//                 fillColor: "#000000",
//                 fillOpacity: 1,
//                 strokeWeight: 1,
//                 strokeColor: "#ffffff",
//               }}
//               label="🎯"
//               onClick={handlePlaceMarkerClick}
//             />

//             {originLocation && (
//               <Marker
//                 position={{
//                   lat: originLocation.latitude,
//                   lng: originLocation.longitude,
//                 }}
//                 icon={{
//                   path: window.google.maps.SymbolPath.CIRCLE,
//                   scale: 10,
//                   fillColor: "#00FF00",
//                   fillOpacity: 1,
//                   strokeWeight: 2,
//                   strokeColor: "#ffffff",
//                 }}
//                 label="📍"
//               />
//             )}

//             {routes.length > 0 && (
//               <>
//                 {routes.map((route, index) => (
//                   <Polyline
//                     key={index}
//                     path={route.decodedPath}
//                     options={{
//                       strokeColor: routeColors[index % routeColors.length],
//                       strokeOpacity: selectedRouteIndex === index ? 0.9 : 0.4,
//                       strokeWeight: selectedRouteIndex === index ? 5 : 3,
//                       zIndex: selectedRouteIndex === index ? 100 : 10,
//                     }}
//                     onClick={() => setSelectedRouteIndex(index)}
//                   />
//                 ))}
                
//                 {selectedLocation && (
//                   <Marker
//                     position={{
//                       lat: selectedLocation.location.latitude,
//                       lng: selectedLocation.location.longitude,
//                     }}
//                     icon={{
//                       path: window.google.maps.SymbolPath.CIRCLE,
//                       scale: 12,
//                       fillColor: "black",
//                       fillOpacity: 1,
//                       strokeWeight: 1,
//                       strokeColor: "#ffffff",
//                     }}
//                     label="🏨"
//                   />
//                 )}
//               </>
//             )}
//           </GoogleMap>
//         )}

//         {pickingOnMap && (
//           <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-10">
//             Click on the map to set origin location
//           </div>
//         )}
//       </div>

//       {sidePanelOpen && (
//         <>
//           <div
//             className="fixed inset-0 bg-black/50 z-40"
//             onClick={() => setSidePanelOpen(false)}
//           />

//           <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-background border-l border-foreground/20 shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
//             <div className="sticky top-0 bg-background border-b border-foreground/20 p-4 flex items-center justify-between">
//               <h2 className="text-xl font-bold">Route Options</h2>
//               <button
//                 onClick={() => setSidePanelOpen(false)}
//                 className="p-2 hover:bg-foreground/10 rounded-md transition-colors"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="flex border-b border-foreground/20">
//               <button
//                 onClick={() => setActiveTab("modes")}
//                 className={cn(
//                   "flex-1 py-3 px-4 font-medium transition-colors",
//                   activeTab === "modes"
//                     ? "bg-primary text-primary-foreground"
//                     : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
//                 )}
//               >
//                 Travel Modes
//               </button>
//               <button
//                 onClick={() => setActiveTab("routes")}
//                 className={cn(
//                   "flex-1 py-3 px-4 font-medium transition-colors",
//                   activeTab === "routes"
//                     ? "bg-primary text-primary-foreground"
//                     : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
//                 )}
//               >
//                 Route Options
//               </button>
//             </div>

//             <div className="p-4 space-y-4">
//               {getWeatherWarning()}

//               {activeTab === "modes" ? (
//                 <>
//                   <div className="space-y-3">
//                     <h3 className="font-semibold text-lg">From Location</h3>

//                     {isLoaded && (
//                       <Autocomplete
//                         onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
//                         onPlaceChanged={onPlaceChanged}
//                       >
//                         <input
//                           type="text"
//                           placeholder="Search for a location..."
//                           value={originInput}
//                           onChange={(e) => setOriginInput(e.target.value)}
//                           className="w-full px-4 py-2 border border-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
//                           style={{color:"black"}}
//                         />
//                       </Autocomplete>
//                     )}

//                     <div className="flex gap-2">
//                       <Button
//                         onClick={handleUseCurrentLocation}
//                         variant="outline"
//                         className="flex-1"
//                       >
//                         <Navigation className="w-4 h-4 mr-2" />
//                         Current Location
//                       </Button>
//                       <Button
//                         onClick={() => setPickingOnMap(!pickingOnMap)}
//                         variant={pickingOnMap ? "default" : "outline"}
//                         className="flex-1"
//                       >
//                         <MapPin className="w-4 h-4 mr-2" />
//                         Pick on Map
//                       </Button>
//                     </div>

//                     {originLocation && (
//                       <p className="text-sm text-green-600 flex items-center gap-2">
//                         <span className="w-2 h-2 bg-green-500 rounded-full" />
//                         Origin set: {originInput}
//                       </p>
//                     )}
//                   </div>

//                   <div className="space-y-3">
//                     <h3 className="font-semibold text-lg">Select Travel Mode</h3>

//                     {["DRIVE", "TRANSIT", "TAXI"].map((mode) => (
//                       <button
//                         key={mode}
//                         onClick={() => setTravelMode(mode)}
//                         className={cn(
//                           "w-full p-4 rounded-lg border-2 transition-all text-left",
//                           travelMode === mode
//                             ? "border-primary bg-primary/10"
//                             : "border-foreground/20 hover:border-foreground/40"
//                         )}
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center gap-3">
//                             {travelModeIcons[mode]}
//                             <span className="font-medium">{travelModeLabels[mode]}</span>
//                           </div>
//                           {travelMode === mode && (
//                             <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
//                               <div className="w-2 h-2 bg-white rounded-full" />
//                             </div>
//                           )}
//                         </div>
                        
//                         {travelMode === mode && selectedRoute && (
//                           <div className="mt-3 space-y-1 text-sm text-foreground/70">
//                             <p>Distance: {getDistance(selectedRoute.distanceMeters)} km</p>
//                             <p>Duration: {getTime(selectedRoute.duration)} min</p>
//                             <p className="font-semibold text-foreground">
//                               Est. Cost: {calculateCost(getDistance(selectedRoute.distanceMeters), mode)}
//                             </p>
                            
//                             {mode === "TRANSIT" && renderTransitDetails()}
//                           </div>
//                         )}
//                       </button>
//                     ))}
//                   </div>

//                   {loadingRoutes && (
//                     <div className="flex items-center justify-center py-4">
//                       <Loader2 className="w-6 h-6 animate-spin" />
//                       <span className="ml-2">Calculating routes...</span>
//                     </div>
//                   )}
//                 </>
//               ) : (
//                 <>
//                   {routes.length > 0 ? (
//                     <>
//                       {travelMode === "DRIVE" && (
//                         <div className="bg-blue-500/20 border border-blue-500 rounded-md p-3 flex items-start gap-2">
//                           <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
//                           <div className="text-sm">
//                             <p className="font-medium text-blue-700">Best Option Right Now</p>
//                             <p className="text-blue-600">
//                               Route {getBestRouteSuggestion() + 1} is the fastest option
//                             </p>
//                           </div>
//                         </div>
//                       )}

//                       <div className="space-y-3">
//                         <h3 className="font-semibold text-lg">
//                           Available Routes ({routes.length})
//                         </h3>

//                         {routes.map((route, index) => (
//                           <button
//                             key={index}
//                             onClick={() => setSelectedRouteIndex(index)}
//                             className={cn(
//                               "w-full p-4 rounded-lg border-2 transition-all text-left",
//                               selectedRouteIndex === index
//                                 ? "border-primary bg-primary/10"
//                                 : "border-foreground/20 hover:border-foreground/40"
//                             )}
//                             style={{
//                               borderLeftWidth: "6px",
//                               borderLeftColor: routeColors[index % routeColors.length],
//                             }}
//                           >
//                             <div className="flex items-center justify-between mb-2">
//                               <span className="font-semibold">Route {index + 1}</span>
//                               {index === getBestRouteSuggestion() && (
//                                 <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
//                                   Fastest
//                                 </span>
//                               )}
//                             </div>

//                             <div className="space-y-1 text-sm text-foreground/70">
//                               <p>📏 {getDistance(route.distanceMeters)} km</p>
//                               <p>⏱️ {getTime(route.duration)} minutes</p>
//                               <p className="font-semibold text-foreground">
//                                 💰 {calculateCost(getDistance(route.distanceMeters), travelMode)}
//                               </p>
//                             </div>
//                           </button>
//                         ))}
//                       </div>
//                     </>
//                   ) : (
//                     <div className="text-center py-8 text-foreground/60">
//                       <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
//                       <p>Select a destination to see route options</p>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </>
//       )}

//       <div className="mt-4 w-full">
//         <h2 className="nearby-locations mt-5 w-full bg-gradient-to-b from-primary/90 to-primary/60 font-bold bg-clip-text text-transparent text-3xl text-center">
//           Nearby Hotels
//         </h2>
//         {nearbyLocation.length === 0 ? (
//           <p className="text-sm text-gray-500 my-5 text-center">
//             <Loader2 size={50} className="animate-spin w-full mt-5" />
//             Loading nearby locations...
//           </p>
//         ) : (
//           <ul className="location-list space-y-2 grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 p-5 lg:grid-cols-4 mx-auto">
//             {nearbyLocation.map((location, index) => {
//               const imageUrl = getImage(location?.photos);

//               return (
//                 <div
//                   onClick={handleSelectLocation(location)}
//                   className="max-w-xs relative w-full group/card border border-foreground/20 rounded-lg overflow-hidden shadow-md cursor-pointer"
//                   key={index}
//                 >
//                   <div
//                     className={cn(
//                       "cursor-pointer overflow-hidden relative card h-72 rounded-md shadow-xl max-w-sm mx-auto flex flex-col justify-between p-4",
//                       "bg-cover bg-center bg-gray-200"
//                     )}
//                     style={{
//                       backgroundImage: imageUrl
//                         ? `url(${imageUrl})`
//                         : "url(/images/main_img_placeholder.jpg)",
//                     }}
//                   >
//                     <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-background to-transparent z-0 pointer-events-none" />
//                     <div className="absolute w-full h-full top-0 left-0 transition duration-300 group-hover/card:bg-background opacity-60"></div>
//                     <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-background to-transparent z-0 pointer-events-none" />

//                     <div className="flex flex-row items-center space-x-4 z-10">
//                       <div className="flex flex-col">
//                         <p className="font-normal text-base text-foreground relative z-10">
//                           # {index + 1}
//                         </p>
//                         <p className="text-sm text-foreground/90">
//                           Rating {location?.rating} ⭐
//                         </p>
//                       </div>
//                     </div>

//                     <div className="text content">
//                       <h1 className="font-bold text-xl md:text-2xl text-foreground relative z-10 line-clamp-2">
//                         {location.name}
//                       </h1>
//                       <p className="font-normal text-sm text-foreground relative z-10 my-4 line-clamp-3">
//                         {location.address}
//                       </p>
//                       {location.googleMapsUri && (
//                         <button
//                           onClick={handleOpenGoogleMaps(location.googleMapsUri)}
//                           className="relative z-20 mt-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md transition-colors flex items-center gap-1"
//                         >
//                           📍 Open in Maps
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </ul>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PlacesDetails;
// Key changes to fix the flashing issue:
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
import { Loader2, X, MapPin, Navigation, Car, Bus, CarTaxiFront, CloudRain, Clock, Star, MessageSquare, ParkingCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const libraries = ["places", "marker"];

const PlacesDetails = ({ PlaceDetailsPageRef }) => {
  const { selectedPlace } = useCache();

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
  } = selectedPlace || {};

  const { lat, lng } = useParams();
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const navigate = useNavigate();

  const [nearbyLocation, setNearbyLocation] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [imagesMap, setImagesMap] = useState(new Map());
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("modes");
  const [travelMode, setTravelMode] = useState("DRIVE");
  const [originLocation, setOriginLocation] = useState(null);
  const [originInput, setOriginInput] = useState("");
  const [pickingOnMap, setPickingOnMap] = useState(false);
  const [weather, setWeather] = useState(null);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [showingMainDestination, setShowingMainDestination] = useState(false);
  const [transitDetails, setTransitDetails] = useState(null);
  const [pendingTravelMode, setPendingTravelMode] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [loadingPlaceDetails, setLoadingPlaceDetails] = useState(false);

  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const isFetchingRoutes = useRef(false);

  const selectedRoute = routes[selectedRouteIndex];
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
    libraries: libraries,
  });

  const fetchWeather = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}&units=metric`
      );
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  useEffect(() => {
    if (latitude && longitude) {
      fetchWeather(latitude, longitude);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      if (!isLoaded || !window.google?.maps?.places?.PlacesService) {
        console.log("Waiting for Google Maps Places library...");
        return;
      }

      if (!latitude || !longitude) {
        console.log("Missing coordinates");
        return;
      }

      setLoadingPlaceDetails(true);
      console.log("Starting place details fetch...");
      
      try {
        const targetMap = mapRef.current?.state?.map || new window.google.maps.Map(document.createElement('div'));
        const service = new window.google.maps.places.PlacesService(targetMap);

        const request = {
          location: new window.google.maps.LatLng(latitude, longitude),
          radius: 100,
        };

        console.log("Searching for nearby places...");

        service.nearbySearch(request, (results, status) => {
          console.log("Nearby search status:", status);
          console.log("Results:", results);

          if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
            const place = results[0];
            console.log("Found place:", place.name, "ID:", place.place_id);
            
            const detailsRequest = {
              placeId: place.place_id,
              fields: [
                'name',
                'formatted_address',
                'rating',
                'user_ratings_total',
                'reviews',
                'editorial_summary',
                'opening_hours',
                'photos',
                'types',
                'wheelchair_accessible_entrance',
                'website',
                'formatted_phone_number'
              ]
            };

            service.getDetails(detailsRequest, (placeDetails, detailsStatus) => {
              console.log("Details status:", detailsStatus);
              
              if (detailsStatus === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                console.log("✅ Place details loaded successfully:", placeDetails);
                
                const transformedDetails = {
                  displayName: { text: placeDetails.name },
                  formattedAddress: placeDetails.formatted_address,
                  editorialSummary: placeDetails.editorial_summary ? 
                    { text: placeDetails.editorial_summary.overview || placeDetails.editorial_summary } : null,
                  rating: placeDetails.rating,
                  userRatingCount: placeDetails.user_ratings_total,
                  reviews: (placeDetails.reviews || []).map(review => ({
                    authorAttribution: {
                      displayName: review.author_name
                    },
                    rating: review.rating,
                    text: {
                      text: review.text
                    },
                    relativePublishTimeDescription: review.relative_time_description,
                    author_name: review.author_name
                  })),
                  types: placeDetails.types,
                  website: placeDetails.website,
                  phone: placeDetails.formatted_phone_number,
                  opening_hours: placeDetails.opening_hours,
                  accessibilityOptions: {
                    wheelchairAccessibleEntrance: placeDetails.wheelchair_accessible_entrance || false
                  }
                };
                
                setPlaceDetails(transformedDetails);
              } else {
                console.error("❌ Failed to get details:", detailsStatus);
                setPlaceDetails(null);
              }
              setLoadingPlaceDetails(false);
            });
          } else {
            console.error("❌ Nearby search failed:", status);
            setPlaceDetails(null);
            setLoadingPlaceDetails(false);
          }
        });
        
      } catch (error) {
        console.error("❌ Error fetching place details:", error);
        setPlaceDetails(null);
        setLoadingPlaceDetails(false);
      }
    };

    const timer = setTimeout(() => {
      fetchPlaceDetails();
    }, 500);

    return () => clearTimeout(timer);
  }, [latitude, longitude, isLoaded]);

  useEffect(() => {
    if (loadingRoutes) {
      return;
    }

    if (travelMode === "TRANSIT" && selectedRoute) {
      if (!selectedRoute?.legs?.[0]?.steps) {
        setTransitDetails(null);
        return;
      }

      const steps = selectedRoute.legs[0].steps;
      const transitSteps = steps.filter(step => step.transitDetails);
      
      if (transitSteps.length === 0) {
        setTransitDetails("no-transit");
      } else {
        setTransitDetails(transitSteps);
      }
    } else if (travelMode !== "TRANSIT") {
      setTransitDetails(null);
    }
  }, [travelMode, selectedRoute, loadingRoutes]);

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
              includedTypes: ["hotel"],
              maxResultCount: 20,
              locationRestriction: {
                circle: {
                  center: { latitude, longitude },
                  radius: 3000,
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

        setNearbyLocation(formatted);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchNearbyPlaces();
  }, [latitude, longitude]);

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
              "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description,routes.legs.steps,routes.legs.steps.transitDetails",
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

  useEffect(() => {
    if (isFetchingRoutes.current) return;

    let destination = null;

    if (selectedLocation) {
      destination = {
        latitude: selectedLocation.location.latitude,
        longitude: selectedLocation.location.longitude,
      };
    } else if (showingMainDestination && latitude && longitude) {
      destination = {
        latitude: latitude,
        longitude: longitude,
      };
    }

    if (destination) {
      const origin = originLocation || { latitude, longitude };

      if (
        origin.latitude !== destination.latitude ||
        origin.longitude !== destination.longitude
      ) {
        isFetchingRoutes.current = true;
        if (travelMode === "TRANSIT") {
          setTransitDetails(null);
        }
        
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
            isFetchingRoutes.current = false;
          }
        ).catch(() => {
          isFetchingRoutes.current = false;
        });
      } else {
        setRoutes([]);
      }
    } else {
      setRoutes([]);
    }
  }, [selectedLocation, travelMode, originLocation, showingMainDestination, latitude, longitude]);

  useEffect(() => {
    nearbyLocation.forEach((location) => {
      const photoRef = location.photos;
      if (photoRef && !imagesMap.has(photoRef)) {
        fetchGooglePhotoUrl(photoRef).then((url) => {
          if (url) {
            setImagesMap((prev) => new Map(prev).set(photoRef, url));
          }
        });
      }
    });
  }, [nearbyLocation]);

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

  const handleMapClick = (e) => {
    if (pickingOnMap) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setOriginLocation({ latitude: lat, longitude: lng });
      setOriginInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setPickingOnMap(false);
    }
  };

  const handlePlaceMarkerClick = () => {
    setSidePanelOpen(true);
    setSelectedLocation(null);
    setShowingMainDestination(true);
  };

  const handleSelectLocation = (location) => () => {
    setSelectedLocation(location);
    setSelectedRouteIndex(0);
    setSidePanelOpen(true);
    setShowingMainDestination(false);
  };

  const handleOpenGoogleMaps = (googleMapsUri) => (e) => {
    e.stopPropagation();
    if (googleMapsUri) {
      window.open(googleMapsUri, "_blank");
    }
  };

  const handleTravelModeChange = (mode) => {
    if (loadingRoutes) return;
    setPendingTravelMode(mode);
    
    setTimeout(() => {
      setTravelMode(mode);
      setPendingTravelMode(null);
    }, 100);
  };

  const getBestRouteSuggestion = () => {
    if (routes.length === 0) return null;

    const fastest = routes.reduce((prev, current) =>
      parseInt(prev.duration) < parseInt(current.duration) ? prev : current
    );

    return routes.indexOf(fastest);
  };

  const getWeatherWarning = () => {
    if (!weather) return null;

    const condition = weather.weather?.[0]?.main;
    const description = weather.weather?.[0]?.description;
    const temp = Math.round(weather.main?.temp);

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

  const renderTransitDetails = () => {
    if (!transitDetails) return null;

    if (transitDetails === "no-transit") {
      return (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-xs">
          <p className="font-semibold text-red-700 mb-1">🚫 No Public Transit Available</p>
          <p className="text-red-600">
            This route doesn't have bus or train service.
          </p>
          <p className="text-red-600 mt-2 text-[10px]">
            💡 Try DRIVE or TAXI mode instead.
          </p>
        </div>
      );
    }

    const getVehicleIcon = (type) => {
      const icons = {
        BUS: "🚌", SUBWAY: "🚇", TRAIN: "🚆", TRAM: "🚊",
        RAIL: "🚆", METRO_RAIL: "🚇", HEAVY_RAIL: "🚆", COMMUTER_TRAIN: "🚆",
      };
      return icons[type] || "🚍";
    };

    return (
      <div className="mt-3 space-y-2">
        <p className="font-semibold text-xs text-green-700">
          ✅ Transit Route ({transitDetails.length} {transitDetails.length === 1 ? 'segment' : 'segments'}):
        </p>
        {transitDetails.map((step, idx) => {
          const transit = step.transitDetails;
          if (!transit) return null;
          
          const line = transit.transitLine || {};
          const vehicle = line.vehicle || {};
          const stopDetails = transit.stopDetails || {};
          const departureStop = stopDetails.departureStop || {};
          const arrivalStop = stopDetails.arrivalStop || {};

          return (
            <div key={idx} className="bg-green-500/5 border border-green-500/20 rounded-md p-3 text-xs space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-2xl">{getVehicleIcon(vehicle.type)}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-foreground">
                    {line.nameShort || line.name || `${vehicle.type || 'Transit'}`}
                  </p>
                  
                  {vehicle.type && (
                    <p className="text-foreground/60 capitalize">
                      {vehicle.type.toLowerCase().replace('_', ' ')}
                    </p>
                  )}
                  
                  {transit.headsign && (
                    <p className="text-foreground/70 italic text-xs">→ {transit.headsign}</p>
                  )}
                  
                  <div className="mt-2 space-y-1">
                    <p className="text-foreground/80">
                      <span className="font-semibold">From:</span> {departureStop.name || 'N/A'}
                    </p>
                    <p className="text-foreground/80">
                      <span className="font-semibold">To:</span> {arrivalStop.name || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="mt-2 flex gap-3 text-foreground/60">
                    {transit.stopCount && <span>🛑 {transit.stopCount} stops</span>}
                    {step.staticDuration && (
                      <span>⏱️ {Math.ceil(parseInt(step.staticDuration.replace('s', '')) / 60)} min</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
    <div ref={PlaceDetailsPageRef} className="main relative">
      <div className="place-details mt-5">
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

      {/* Place Details Section */}
    {/* Place Details Section - Only Visitor Tips */}
{loadingPlaceDetails ? (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
    <span className="ml-2 text-foreground/60">Loading place information...</span>
  </div>
) : placeDetails ? (
  <div className="px-4 md:px-8 py-6 space-y-6 max-w-6xl mx-auto">
    {/* Editorial Summary */}
    {placeDetails.editorialSummary?.text && (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-700 mb-1 text-base">About This Place</h3>
            <p className="text-foreground/80 text-sm">{placeDetails.editorialSummary.text}</p>
          </div>
        </div>
      </div>
    )}

    {/* Ratings & Reviews */}
    {placeDetails.rating && (
      <div className="bg-foreground/5 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h3 className="font-semibold text-lg">Ratings & Reviews</h3>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{placeDetails.rating.toFixed(1)}</div>
            <div className="text-sm text-foreground/60">
              {placeDetails.userRatingCount || 0} reviews
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-5 h-5",
                    star <= Math.round(placeDetails.rating)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* User Reviews */}
        {placeDetails.reviews && placeDetails.reviews.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-foreground text-base">
              <MessageSquare className="w-4 h-4" />
              What People Say
            </h4>
            {placeDetails.reviews.slice(0, 5).map((review, idx) => (
              <div key={idx} className="bg-background border border-foreground/10 rounded-md p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {(review.authorAttribution?.displayName || review.author_name || 'A')[0]}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-sm block">
                        {review.authorAttribution?.displayName || review.author_name || 'Anonymous'}
                      </span>
                      {review.relativePublishTimeDescription && (
                        <span className="text-xs text-foreground/50">
                          {review.relativePublishTimeDescription}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-medium">{review.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-foreground/70 line-clamp-3">
                  {review.text?.text || review.text || 'No review text'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Accessibility */}
    {placeDetails.accessibilityOptions?.wheelchairAccessibleEntrance && (
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <h3 className="font-semibold text-purple-700 mb-2 flex items-center gap-2 text-base">
          ♿ Accessibility
        </h3>
        <div className="text-sm text-foreground/80">
          ✓ Wheelchair accessible entrance
        </div>
      </div>
    )}

    {/* Parking Note */}
    {/* <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
      <p className="text-sm text-orange-700 mb-2">
        🅿️ <strong>Parking:</strong> Detailed parking information is not available through the API.
      </p>
      <p className="text-sm text-orange-700">
        🕒 <strong>Popular times:</strong> Visit Google Maps for live busy times and crowd information.
      </p>
    </div> */}

    {/* Visitor Tips & Best Times - LARGER FONT */}
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-5">
      <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
        💡 Visitor Tips & Best Times
      </h3>
      
      <div className="space-y-4">
        {/* Best Time to Visit */}
        <div className="bg-background/50 rounded-md p-4">
          <h4 className="font-semibold text-base text-blue-700 mb-3">🕒 Best Time to Visit</h4>
          <ul className="text-sm text-foreground/80 space-y-2 list-disc list-inside">
            <li>Early morning (6 AM - 10 AM) or late afternoon (4 PM - 7 PM) for fewer crowds</li>
            <li>Weekdays are generally less crowded than weekends</li>
            <li>Avoid peak hours (12 PM - 2 PM) during summer months</li>
            {placeDetails.opening_hours?.open_now !== undefined && (
              <li className="font-medium text-green-700">
                {placeDetails.opening_hours.open_now ? "Currently open - good time to visit!" : "Currently closed - plan your visit accordingly"}
              </li>
            )}
          </ul>
        </div>

        {/* Key Points */}
        <div className="bg-background/50 rounded-md p-4">
          <h4 className="font-semibold text-base text-purple-700 mb-3">📌 Important Points</h4>
          <ul className="text-sm text-foreground/80 space-y-2 list-disc list-inside">
            <li>Carry sufficient water and snacks, especially during long visits</li>
            <li>Wear comfortable walking shoes</li>
            <li>Check weather conditions before visiting</li>
            <li>Follow local guidelines and respect cultural norms</li>
            {placeDetails.accessibilityOptions?.wheelchairAccessibleEntrance && (
              <li className="text-purple-700 font-medium">Wheelchair accessible - suitable for all visitors</li>
            )}
          </ul>
        </div>

        {/* Seasonal Recommendations */}
        <div className="bg-background/50 rounded-md p-4">
          <h4 className="font-semibold text-base text-orange-700 mb-3">🌤️ Seasonal Tips</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-foreground">🌸 Spring/Autumn</p>
              <p className="text-foreground/70">Best weather, ideal for visits</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">☀️ Summer</p>
              <p className="text-foreground/70">Visit early morning or evening</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">🌧️ Monsoon</p>
              <p className="text-foreground/70">Check for weather alerts</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">❄️ Winter</p>
              <p className="text-foreground/70">Pleasant weather, carry jacket</p>
            </div>
          </div>
        </div>

        {/* Things to Remember */}
        <div className="bg-background/50 rounded-md p-4">
          <h4 className="font-semibold text-base text-green-700 mb-3">✅ Things to Remember</h4>
          <ul className="text-sm text-foreground/80 space-y-2 list-disc list-inside">
            <li>Parking availability may vary - arrive early to find spots</li>
            <li>Keep your belongings safe and secure</li>
            <li>Photography rules may apply - check signage</li>
            <li>Mobile network coverage is usually available</li>
            {placeDetails.website && (
              <li>
                Visit{' '}
                <a 
                  href={placeDetails.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  official website
                </a>
                {' '}for latest updates
              </li>
            )}
          </ul>
        </div>

        {/* Duration Recommendation */}
        <div className="bg-blue-600 text-white rounded-md p-4">
          <h4 className="font-semibold text-base mb-2">⏱️ Recommended Visit Duration</h4>
          <p className="text-sm opacity-90">
            Plan for 2-3 hours to fully explore and enjoy this location
          </p>
        </div>
      </div>
    </div>
  </div>
) : (
  <div className="px-4 py-6 text-center text-foreground/60">
    <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
    <p className="text-sm">Additional place information is not available for this location</p>
  </div>
)}


      <div className="map-location-place mt-5 w-full bg-gradient-to-b from-primary/90 to-primary/60 font-bold bg-clip-text text-transparent text-3xl text-center">
        Map Location
      </div>

      <div className="place-map rounded-lg m-4 md:m-2 overflow-hidden shadow-md flex flex-col gap-2 md:flex-row relative">
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
              label="🎯"
              onClick={handlePlaceMarkerClick}
            />

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

            {routes.length > 0 && (
              <>
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
                
                {selectedLocation && (
                  <Marker
                    position={{
                      lat: selectedLocation.location.latitude,
                      lng: selectedLocation.location.longitude,
                    }}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 12,
                      fillColor: "black",
                      fillOpacity: 1,
                      strokeWeight: 1,
                      strokeColor: "#ffffff",
                    }}
                    label="🏨"
                  />
                )}
              </>
            )}
          </GoogleMap>
        )}

        {pickingOnMap && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-10">
            Click on the map to set origin location
          </div>
        )}
      </div>

      {sidePanelOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidePanelOpen(false)}
          />

          <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-background border-l border-foreground/20 shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-background border-b border-foreground/20 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Route Options</h2>
              <button
                onClick={() => setSidePanelOpen(false)}
                className="p-2 hover:bg-foreground/10 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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

            <div className="p-4 space-y-4">
              {getWeatherWarning()}

              {activeTab === "modes" ? (
                <>
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

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Select Travel Mode</h3>

                    {["DRIVE", "TRANSIT", "TAXI"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleTravelModeChange(mode)}
                        disabled={loadingRoutes}
                        className={cn(
                          "w-full p-4 rounded-lg border-2 transition-all text-left",
                          travelMode === mode
                            ? "border-primary bg-primary/10"
                            : "border-foreground/20 hover:border-foreground/40",
                          loadingRoutes && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {travelModeIcons[mode]}
                            <span className="font-medium">{travelModeLabels[mode]}</span>
                          </div>
                          {travelMode === mode && !loadingRoutes && (
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        
                        {travelMode === mode && !loadingRoutes && selectedRoute && (
                          <div className="mt-3 space-y-1 text-sm text-foreground/70">
                            <p>Distance: {getDistance(selectedRoute.distanceMeters)} km</p>
                            <p>Duration: {getTime(selectedRoute.duration)} min</p>
                            <p className="font-semibold text-foreground">
                              Est. Cost: {calculateCost(getDistance(selectedRoute.distanceMeters), mode)}
                            </p>
                            
                            {mode === "TRANSIT" && (
                              loadingRoutes ? (
                                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md text-xs">
                                  <p className="text-blue-700">🔄 Checking transit availability...</p>
                                </div>
                              ) : (
                                renderTransitDetails()
                              )
                            )}
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
                  {routes.length > 0 ? (
                    <>
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

      <div className="mt-4 w-full">
        <h2 className="nearby-locations mt-5 w-full bg-gradient-to-b from-primary/90 to-primary/60 font-bold bg-clip-text text-transparent text-3xl text-center">
          Nearby Hotels
        </h2>
        {nearbyLocation.length === 0 ? (
          <p className="text-sm text-gray-500 my-5 text-center">
            <Loader2 size={50} className="animate-spin w-full mt-5" />
            Loading nearby locations...
          </p>
        ) : (
          <ul className="location-list space-y-2 grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 p-5 lg:grid-cols-4 mx-auto">
            {nearbyLocation.map((location, index) => {
              const imageUrl = getImage(location?.photos);

              return (
                <div
                  onClick={handleSelectLocation(location)}
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
                          Rating {location?.rating} ⭐
                        </p>
                      </div>
                    </div>

                    <div className="text content">
                      <h1 className="font-bold text-xl md:text-2xl text-foreground relative z-10 line-clamp-2">
                        {location.name}
                      </h1>
                      <p className="font-normal text-sm text-foreground relative z-10 my-4 line-clamp-3">
                        {location.address}
                      </p>
                      {location.googleMapsUri && (
                        <button
                          onClick={handleOpenGoogleMaps(location.googleMapsUri)}
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

export default PlacesDetails;
