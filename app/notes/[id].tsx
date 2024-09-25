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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
    } catch (error) {
      Alert.alert("Error", "Failed to load note", [{ text: "Okay" }]);
    }
  };

  const updateNote = async () => {
    setIsSaving(true);
    try {
      let imageUrls: string[] = [];
      if (imagePaths && imagePaths.length > 0) {
        imageUrls = await Promise.all(
          imagePaths.map((imagePath) => uploadImage(imagePath))
        );
      }

      await updateDoc(doc(collection(database, "notes"), noteId), {
        text: updatedNote,
        imageUrls,
      });
      setNote("");
      Redirect({ href: "/" });
    } catch (error) {
      Alert.alert("Error", "Failed to add note", [{ text: "Okay" }]);
    }
    setIsSaving(false);
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

          {imagePaths.length === 0 ? (
            <Button title="Select Image" onPress={launchImagePicker} />
          ) : (
            <View>
              <Button
                title="Select one more image"
                onPress={launchImagePicker}
              />
              <Button title="Save images" onPress={updateNote} />
            </View>
          )}

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
                      setImagePaths((paths) =>
                        paths.filter((_, i) => i !== index)
                      );
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
