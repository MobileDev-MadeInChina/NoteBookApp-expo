import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function NoteScreen() {
  const router = useRouter();
  const [note, setNote] = useState("");

  useEffect(() => {
    const note = router.query.note;
    setNote(note);
  }, [router.query]);

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
