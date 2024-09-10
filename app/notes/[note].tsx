import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function NoteScreen() {
  const router = useRouter();
  const [note, setNote] = useState("");

  const loadNote = async () => {
    try {
      const savedNote = await AsyncStorage.getItem("note");
      if (savedNote !== null) {
        setNote(JSON.parse(savedNote));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load note", [{ text: "Okay" }]);
    }
  };

  useEffect(() => {
    loadNote();
  }, []);

  return (
    <View style={styles.container}>
      <Text>{note}</Text>
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
});
