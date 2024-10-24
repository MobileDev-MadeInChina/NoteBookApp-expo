import MapView, { Marker, Region } from "react-native-maps";
import { useEffect, useState } from "react";
import type { NoteMarker } from "@/types";
import { MarkerModal } from "@/components/MarkerModal";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { database } from "../firebase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function MapScreen() {
  const [showModal, setShowModal] = useState(false);
  const [markers, setMarkers] = useState<NoteMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<NoteMarker | null>(null);
  const router = useRouter();

  // get the current location from the search params if available.
  const params = useLocalSearchParams();
  const coordinate = params.latitude
    ? {
        latitude: parseFloat(params.latitude as string),
        longitude: parseFloat(params.longitude as string),
      }
    : null;
  // set the current region based on the url param coordinates or default values (Guldbergsgade)
  const [currentRegion, setCurrentRegion] = useState<Region>({
    latitude: coordinate?.latitude || 55.6704,
    longitude: coordinate?.longitude || 12.5785,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

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
