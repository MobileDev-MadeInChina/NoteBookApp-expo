import {
  Button,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,                                                 
} from "react-native";
import { Marker } from "../app/map";
import { useState } from "react";
import { collection, doc, getDoc } from "firebase/firestore";
import { database } from "@/firebase";
import { TextInput } from "react-native-gesture-handler";
import * as ImagePicker from "expo-image-picker";
import { Note } from "@/app";

// Modal to display the marker details or get user input
export async function MarkerModal({ marker }: { marker: Marker }) {
  const [showModal, setShowModal] = useState(false);
  // State for array of images
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  // State for deleted image urls
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  // State for displaying the note 
  const [note, setNote] = useState<Note>({
    id: "",
    text: "", 
    imageUrls: [], 
    mark: null,
  });

  //check database for notes with matching marker key
  const tnote = await getDoc(doc(collection(database, "notes", marker.key)));
  // Set note to the note with matching marker key
  if (!tnote === undefined) {
    const note: Note = {
      id: tnote.id,
      text: tnote.get("text"),
      imageUrls: tnote.get("imageUrls"),
      mark: marker,
    };
    setNote(note);
  }

  async function launchImagePicker() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImagePaths((paths) => [...paths, result.assets[0].uri]);
    }
  }

  return (
    <View>
      <Modal
        animationType="slide"
        transparent={true} 
        visible={showModal}
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalContainer}>
          <Text>Marker Modal</Text>
          <TextInput
            placeholder="Enter a note"
            value={note ? note.text : ""}
            onChange={() => {
              setNote((note) => ({ ...note, text: note.text }));
            }}
          />
          <Button title="Select image" onPress={launchImagePicker} />
        </View>
        {imagePaths && (
          <View>
            {imagePaths.map((imagePath, index) => (
              <View key={index}>
                <Image
                  key={index}
                  source={{ uri: imagePath }}
                  style={{ width: 100, height: 100 }}
                />
                <Button
                  title="Remove"
                  onPress={() => {
                    if (imagePath.includes("http")) {
                      // if it's a URL, add it to the deletedImageUrls array
                      setDeletedImageUrls((urls) => [...urls, imagePath]);
                      // remove it from the imagePaths array
                      setImagePaths((paths) =>
                        paths.filter((_, i) => i !== index)
                      );
                    } else {
                      // if it's a local path, remove it from the imagePaths array
                      setImagePaths((paths) =>
                        paths.filter((_, i) => i !== index)
                      );
                    }
                  }}
                />
              </View>
            ))}
          </View>
        )}
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  button: {
    padding: 5,
    backgroundColor: "#ff6347",
    borderRadius: 3,
  },
  buttonText: {
    color: "#fff",
  },
});
