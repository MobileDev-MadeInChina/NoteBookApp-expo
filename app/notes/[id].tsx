import { database } from "@/firebase";
import { Redirect, useLocalSearchParams } from "expo-router";
import { updateDoc, collection, doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { storage } from "@/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getStorage,
} from "firebase/storage";

export default function NoteScreen() {
  // Get note from URL params
  const params = useLocalSearchParams();
  // State for displaying the note
  const [note, setNote] = useState("");
  // State for editing and saving notes
  const [updatedNote, setUpdatedNote] = useState("");
  // State for editing and saving
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // State for array of images
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  // State for deleted image urls
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);

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

  async function uploadImage(imagePath: string) {
    const res = await fetch(imagePath);
    const blob = await res.blob();
    const storageRef = ref(storage, `images/${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob).then((snapshot) => {
      console.log(snapshot);
    });

    return getDownloadURL(storageRef);
  }

  const noteId: string = params.id as string;

  const loadNote = async () => {
    try {
      const note = await getDoc(doc(collection(database, "notes"), noteId));

      if (note === undefined) {
        console.log("No notes found");
        return;
      }
      setNote(note.get("text"));
      setUpdatedNote(note.get("text"));
      setImagePaths(note.get("imageUrls"));
    } catch (error) {
      Alert.alert("Error", "Failed to load note", [{ text: "Okay" }]);
    }
  };

  const updateNote = async () => {
    setIsSaving(true);
    try {
      let imageUrls: string[] = [];
      // Iterate through the imagePaths array and upload or add the image URLs to the note
      if (imagePaths && imagePaths.length > 0) {
        for (let i = 0; i < imagePaths.length; i++) {
          const imagePath = imagePaths[i];
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
      await updateDoc(doc(collection(database, "notes"), noteId), {
        text: updatedNote,
        imageUrls,
      });

      // delete images from storage
      for (let i = 0; i < deletedImageUrls.length; i++) {
        const imageUrl = deletedImageUrls[i];
        await deleteImage(imageUrl);
      }

      Redirect({ href: "/" });
    } catch (error) {
      Alert.alert("Error", "Failed to add note", [{ text: "Okay" }]);
    }
    setIsSaving(false);
  };

  const deleteImage = async (imageUrl: string) => {
    try {
      const response = await deleteObject(ref(getStorage(), imageUrl));
      console.log(response);
    } catch (error) {
      Alert.alert("Error", "Failed to delete image in storage", [
        { text: "Okay" },
      ]);
    }
  };

  const editNote = async () => {
    setUpdatedNote(note);
    setIsEditing(!isEditing);
  };

  useEffect(() => {
    loadNote();
  }, []);

  return (
    <View style={styles.container}>
      {isSaving && <Text>Saving...</Text>}
      {isEditing ? (
        <View>
          <TextInput
            placeholder="Enter a note"
            value={updatedNote}
            onChangeText={setUpdatedNote}
          />
          <Pressable style={styles.button} onPress={editNote}>
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={updateNote}>
            <Text style={styles.buttonText}>Save</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          <Text>{note}</Text>
          <Button title="Edit text" onPress={editNote} />

          <View>
            <Button title="Select image" onPress={launchImagePicker} />
            <Button title="Save" onPress={updateNote} />
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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
