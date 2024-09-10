import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  ScrollView,
  Alert,
  Pressable,
  Link,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const addNote = async () => {
    const updatedNotes = [...notes, text];
    setNotes(updatedNotes);
    setText("");
    await saveNotes(updatedNotes);
  };

  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem("notes");
      if (savedNotes !== null) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load notes", [{ text: "Okay" }]);
    }
  };

  const saveNotes = async (notes: string[]) => {
    try {
      await AsyncStorage.setItem("notes", JSON.stringify(notes));
    } catch (error) {
      Alert.alert("Error", "Failed to save notes", [{ text: "Okay" }]);
    }
  };

  const deleteNote = async (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter a note"
        value={text}
        onChangeText={setText}
      />
      <Button title="Add Note" onPress={addNote} />
      <ScrollView style={styles.notesContainer}>
        {notes.map((note, index) => (
          <View key={index} style={styles.noteContainer}>
            <Pressable onPress={() => Alert.alert("Note", note)}>
              <Text style={styles.note}>
                {index + 1}. {note}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => deleteNote(index)}
              style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
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
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    width: "100%",
  },
  notesContainer: {
    marginTop: 20,
    width: "100%",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  note: {
    flex: 1,
  },
  deleteButton: {
    padding: 5,
    backgroundColor: "#ff6347",
    borderRadius: 3,
  },
  deleteButtonText: {
    color: "#fff",
  },
});
