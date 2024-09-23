import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { Link } from "expo-router";
import { database } from "../firebase";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, doc, addDoc, deleteDoc } from "firebase/firestore";

type Note = { id: string; text: string };

export default function HomeScreen() {
  const [text, setText] = useState("");

  const [values, loading, error] = useCollection(collection(database, "notes"));

  if (values === undefined) {
    console.log("Could not load notes");
    return;
  }
  const data: Note[] = values.docs.map((doc) => ({
    id: doc.id,
    text: doc.data().text,
  }));

  const addNote = async () => {
    try {
      await addDoc(collection(database, "notes"),  {
        text: text,
      });
      setText("");
    } catch (error) {
      Alert.alert("Error", "Failed to add note", [{ text: "Okay" }]);
    }
  };

  const deleteNote = async (index: number) => {
    try {
      if (data === undefined) {
        console.log("No notes found");
        return;
      }
      await deleteDoc(doc(collection(database, "notes"), data[index].id));
    } catch (error) {
      Alert.alert("Error", "Failed to delete note", [{ text: "Okay" }]);
    }
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
        {data &&
          data.map((note, index) => (
            <View key={index} style={styles.noteContainer}>
              <Link href={{ pathname: "/notes/[id]", params: { id: note.id } }}>
                <Text style={styles.note}>
                  {index + 1}.
                  {note.text.length > 24
                    ? `${note.text.slice(0, 24)}...`
                    : note.text}
                </Text>
              </Link>
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
