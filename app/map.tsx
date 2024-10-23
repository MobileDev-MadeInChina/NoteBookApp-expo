import MapView, { LatLng, Marker } from "react-native-maps";
import { useState } from "react";

export type Marker = { coordinate: LatLng; key: string; title: string };

export default function MapScreen() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [region, setRegion] = useState({
    latitude: 55.6704,
    longitude: 12.5785,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  function addMarker(data: any) {
    const { latitude, longitude } = data.nativeEvent.coordinate;
    const newMarker = {
      coordinate: { latitude, longitude },
      key: data.timeStamp.toString(),
      title: data.timeStamp.toString(),
    };

    setMarkers([...markers, newMarker]);
  }

  return (
    <MapView style={{ flex: 1 }} region={region} onLongPress={addMarker}>
      {markers.map((marker) => (
        <Marker
          key={marker.key}
          coordinate={marker.coordinate}
          title={marker.title}
          onPress={() => console.log("Marker pressed")}
        />
      ))}
    </MapView>
  );
}
