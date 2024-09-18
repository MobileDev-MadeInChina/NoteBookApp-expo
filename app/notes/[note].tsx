import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
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

  const loadNote = async () => {
    try {
      const note = params.note.toString();
      setNote(note);
    } catch (error) {
      Alert.alert("Error", "Failed to load note", [{ text: "Okay" }]);
    }
  };

  const saveNote = async () => {
    setIsSaving(true);
    try {
      // Get all notes to update
      const allNotes = await AsyncStorage.getItem("notes");
      if (allNotes === null) {
        console.log("No notes found");
        return;
      }
      // Parse notes to array
      let notes = JSON.parse(allNotes);

      // remove old note with splice. Mutates the existing array
      const oldNoteIndex = notes.indexOf(note);
      notes.splice(oldNoteIndex, 1);
      // Add updated note to array at the old index with splice
      notes.splice(oldNoteIndex, 0, updatedNote);

      // Save updated notes
      await AsyncStorage.setItem("notes", JSON.stringify(notes));

      // Go back to home screen
      router.push("/");
    } catch (error) {
      Alert.alert("Error", "Failed to save note", [{ text: "Okay" }]);
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
          <Pressable style={styles.button} onPress={saveNote}>
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
