import { database } from "@/firebase";
import { Redirect, useLocalSearchParams } from "expo-router";
import {
  updateDoc,
  collection,
  doc,
  getDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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
      await updateDoc(doc(collection(database, "notes"), noteId), {
        text: updatedNote,
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
          <Button title="Edit" onPress={editNote} />
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
