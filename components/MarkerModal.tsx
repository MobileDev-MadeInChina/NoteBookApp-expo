import {
  Alert,
  Button,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { storage, database } from "../firebase";
import { useState, useEffect } from "react";
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { Note, NoteMarker } from "@/types";

// Modal to display the marker details and get user input
export function MarkerModal({
  marker,
  setMarker,
  showModal,
  setShowModal,
}: {
  marker: NoteMarker;
  setMarker: React.Dispatch<React.SetStateAction<NoteMarker | null>>;
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  // State for deleted image urls
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  // State for displaying the note
  const [note, setNote] = useState<Note>({
    id: "",
    text: "",
    imageUrls: [],
    mark: marker,
  });

  useEffect(() => {
    const fetchNote = async () => {
      try {
        // get note from Firebase on mark key
        const tnote = await getDoc(doc(database, "notes", marker.key));
        // if note exists, set it to the note state
        if (tnote.exists()) {
          const fetchedNote: Note = {
            id: tnote.id,
            text: tnote.get("text"),
            imageUrls: tnote.get("imageUrls"),
            mark: marker,
          };
          setNote(fetchedNote);
        }
      } catch (error) {
        console.error("Error fetching note:", error);
      }
    };

    if (marker.key) {
      fetchNote();
    }
  }, [marker]);
  // launch image picker
  async function launchImagePicker() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setNote((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, result.assets[0].uri],
      }));
    }
  }
  // upload image to Firebase Storage
  async function uploadImage(imagePath: string) {
    const res = await fetch(imagePath);
    const blob = await res.blob();
    const storageReference = storageRef(storage, `images/${Date.now()}.jpg`);
    await uploadBytes(storageReference, blob);
    return getDownloadURL(storageReference);
  }
  // update note in Firebase
  const updateNote = async () => {
    setIsSaving(true);
    try {
      // initialize imageUrls array
      let imageUrls: string[] = [];
      // Iterate through the imagePaths array and upload or add the image URLs to the imageUrls array
      if (note && note.imageUrls.length > 0) {
        for (let i = 0; i < note.imageUrls.length; i++) {
          const imagePath = note.imageUrls[i];
          if (!imagePath.includes("http")) {
            // if not a URL, upload it to Firebase Storage and get the URL
            const imageUrl = await uploadImage(imagePath);
            imageUrls.push(imageUrl);
          } else {
            // if it's a URL, just add it to the array
            imageUrls.push(imagePath);
          }
        }
      }

      // update the note in Firebase
      await updateDoc(doc(database, "notes", note.id), {
        text: note.text,
        imageUrls,
        mark: note.mark,
      });

      // delete removed images from storage
      for (let i = 0; i < deletedImageUrls.length; i++) {
        const imageUrl = deletedImageUrls[i];
        await deleteImage(imageUrl);
      }

      Alert.alert("Success", "Note saved successfully", [{ text: "OK" }]);
      setShowModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to save note", [{ text: "OK" }]);
      console.error("Error updating note:", error);
    }
    // reset the marker and isSaving states
    setMarker(null);
    setIsSaving(false);
  };
  // add note to Firebase
  const addNote = async () => {
    try {
      await addDoc(collection(database, "notes"), {
        text: note.text,
        imageUrls: note.imageUrls,
        mark: note.mark,
      });
      Alert.alert("Success", "Note added successfully", [{ text: "OK" }]);
      setShowModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to add note", [{ text: "OK" }]);
      console.error("Error adding note:", error);
    }
    setMarker(null);
  };
  // delete image from storage
  const deleteImage = async (imageUrl: string) => {
    try {
      const imageRef = storageRef(storage, imageUrl);
      await deleteObject(imageRef);
      console.log("Image deleted:", imageUrl);
    } catch (error) {
      Alert.alert("Error", "Failed to delete image from storage", [
        { text: "OK" },
      ]);
      console.error("Error deleting image:", error);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={showModal}>
      <View style={styles.modalContainer}>
        <Text style={styles.title}>Marker Details</Text>
        <TextInput
          placeholder="Enter a note"
          value={note.text}
          onChangeText={(text) => setNote((prev) => ({ ...prev, text }))}
          style={styles.input}
        />
        <Button title="Select Image" onPress={launchImagePicker} />
        {note.imageUrls.length > 0 ? (
          <View style={styles.imageContainer}>
            {note.imageUrls.map((imagePath, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: imagePath }} style={styles.image} />
                <Pressable
                  onPress={() => {
                    if (imagePath.includes("http")) {
                      // if it's a URL, add it to the deletedImageUrls array
                      setDeletedImageUrls((urls) => [...urls, imagePath]);
                      // remove it from the imagePaths array
                      setNote((note) => ({
                        ...note,
                        imageUrls: note.imageUrls.filter((_, i) => i !== index),
                      }));
                    } else {
                      // if it's a local path, remove it from the imagePaths array
                      setNote((note) => ({
                        ...note,
                        imageUrls: note.imageUrls.filter((_, i) => i !== index),
                      }));
                    }
                  }}>
                  <Text>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noImagesText}>No images found</Text>
        )}
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.button}
            onPress={() => {
              setMarker(null);
              setShowModal(false);
            }}>
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
          {isSaving ? (
            <p>Saving...</p>
          ) : (
            <Pressable
              style={styles.button}
              onPress={() => (note.id !== "" ? updateNote() : addNote())}>
              <Text style={styles.buttonText}>
                {note.id !== "" ? "Update" : "Save"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    marginTop: 100,
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  imageContainer: {
    marginVertical: 10,
  },
  imageWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  image: {
    width: 100,
    height: 100,
    marginRight: 10,
  },
  noImagesText: {
    textAlign: "center",
    color: "#888",
    marginVertical: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    padding: 10,
    backgroundColor: "#ff6347",
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
  },
});
