import MapView, { Marker, Region } from "react-native-maps";
import { useEffect, useState } from "react";
import type { NoteMarker } from "@/types";
import { MarkerModal } from "@/components/MarkerModal";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { database } from "../firebase";
import { useLocalSearchParams } from "expo-router";

export default function MapScreen() {
  const [showModal, setShowModal] = useState(false);
  const [markers, setMarkers] = useState<NoteMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<NoteMarker | null>(null);

  const coordinate = useLocalSearchParams().latitude
    ? {
        latitude: parseFloat(useLocalSearchParams().latitude as string),
        longitude: parseFloat(useLocalSearchParams().longitude as string),
      }
    : null;

  const [currentRegion, setCurrentRegion] = useState<Region>({
    latitude: coordinate?.latitude || 55.6704,
    longitude: coordinate?.longitude || 12.5785,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const [values, loading, error] = useCollection(collection(database, "notes"));

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

  function selectMarker(marker: NoteMarker) {
    setSelectedMarker(marker);
    setShowModal(true);
  }

  return (
    <>
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
    </>
  );
}
