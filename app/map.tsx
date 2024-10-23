import MapView, { Marker } from "react-native-maps";
import { useState } from "react";
import { View } from "react-native-reanimated/lib/typescript/Animated";

export default function MapScreen() {
  const [markers, setMarkers] = useState([])
  const [region, setRegion] = useState({
    latitude: 55.6704,  
    longitude: 12.5785, 
    latitudeDelta: 0.005,  
    longitudeDelta: 0.005,  
  });

  function addMarker(data) {
    const {latitude, longitude} = data.nativeEvent.coordinate
    const newMarker = { 
      coordinate: {latitude, longitude}, 
      key: data.timeStamp,
      title: "Great Place"
    }

    setMarkers([...markers, newMarker])

  }

  return (
    <View>
    <MapView
      style={{ flex: 1 }}
      region={region}
      onLongPress={addMarker}
    >

    {markers.map (marker => (
      <Marker
        key={marker.key}
        coordinate={marker.coordinate}
        title={marker.title}
      />
    ))}

    </MapView>
    </View>

  );
}

