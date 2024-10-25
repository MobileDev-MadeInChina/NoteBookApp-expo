import * as ImagePicker from "expo-image-picker";

// launch image picker
export async function launchImagePicker() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });
  if (!result.canceled && result.assets.length > 0) {
    return result.assets[0].uri;
  }
}
