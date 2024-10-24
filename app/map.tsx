import MapView, { LatLng, Marker, Region } from "react-native-maps";
import { useEffect, useMemo, useState, useRef } from "react";
import type { NoteMarker } from "@/types";
import { MarkerModal } from "@/components/MarkerModal";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { database } from "../firebase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import * as Location from "expo-location";

export default function MapScreen() {
  const [showModal, setShowModal] = useState(false);
  // State for all markers
  const [markers, setMarkers] = useState<NoteMarker[]>([]);
  // state for selected marker
  const [selectedMarker, setSelectedMarker] = useState<NoteMarker | null>(null);
  // set the current region based on the url param coordinates or default values (Guldbergsgade)
  const [currentRegion, setCurrentRegion] = useState<Region>();
  // router hook
  const router = useRouter();
  // ref to mapView
  const mapView = useRef<MapView | null>(null);
  // ref to location subscription
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null
  );
  // useEffect to listen for location updates.
  useEffect(() => {
    async function startListening() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        return;
      }
      // watchPositionAsync returns a LocationSubscription object
      locationSubscription.current = await Location.watchPositionAsync(
        {
          distanceInterval: 1000,
          accuracy: Location.Accuracy.High,
        },
        (lokation) => {
          const newRegion = {
            latitude: lokation.coords.latitude,
            longitude: lokation.coords.longitude,
            latitudeDelta: 20,
            longitudeDelta: 20,
          };
          // Update the currentRegion state with the new region
          setCurrentRegion(newRegion);
          // Animate the map to the new region
          if (mapView.current) {
            mapView.current.animateToRegion(newRegion);
          }
        }
      );
    }
    // Start listening for location updates
    startListening();
    return () => {
      // Clean up location subscription on unmount
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // get the current location from the search params if available.
  const params = useLocalSearchParams<{
    latitude: string;
    longitude: string;
  }>();

  // useMemo to memoize the coordinates object to prevent unnecessary re-renders
  const coordinates: LatLng | null = useMemo(() => {
    return params.latitude && params.longitude
      ? {
          latitude: parseFloat(params.latitude),
          longitude: parseFloat(params.longitude),
        }
      : null;
  }, [params.latitude, params.longitude]);

  // set the current region based on the search params or default values (Guldbergsgade)
  useEffect(() => {
    if (coordinates) {
      setCurrentRegion({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  }, [coordinates]);

  const [values] = useCollection(collection(database, "notes"));

  // useEffect to fetch notes from Firebase and set the markers state
  useEffect(() => {
    if (values) {
      setMarkers(
        values.docs.map((doc) => ({
          coordinate: {
            latitude: doc.data().mark.coordinate.latitude,
            longitude: doc.data().mark.coordinate.longitude,
          },
          key: doc.id,
          title: doc.data().text,
        }))
      );
    }
  }, [values]);

  // add marker to markers state and open MarkerModal
  function addMarker(event: any) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newMarker: NoteMarker = {
      coordinate: { latitude, longitude },
      key: `${Date.now()}`,
      title: "",
    };
    setSelectedMarker(newMarker);
    setShowModal(true);
  }

  // select marker and open MarkerModal
  function selectMarker(marker: NoteMarker) {
    setSelectedMarker(marker);
    setShowModal(true);
  }

  return (
    <View className="flex-1">
      <View className="absolute top-10 right-4 z-10">
        <Pressable
          className="bg-green-500 px-4 py-2 rounded-md shadow-md"
          onPress={() => router.push("/")}>
          <Text className="text-white font-bold">My Notes</Text>
        </Pressable>
      </View>
      <MapView
        style={{ flex: 1 }}
        region={currentRegion}
        onLongPress={addMarker}>
        {markers.map((marker) => (
          <Marker
            key={marker.key}
            coordinate={marker.coordinate}
            title={marker.title}
            onPress={() => selectMarker(marker)}
          />
        ))}
      </MapView>
      {selectedMarker && (
        <MarkerModal
          marker={selectedMarker}
          setMarker={setSelectedMarker}
          showModal={showModal}
          setShowModal={setShowModal}
        />
      )}
    </View>
  );
}
