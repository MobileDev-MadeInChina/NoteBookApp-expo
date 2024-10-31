import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Pressable,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { Note } from "@/types";
import { launchImagePicker } from "@/services/imagePicker";
import { selectNoteById, updateNote } from "@/services/notesService";
import { useAuth } from "../AuthContext";

export default function NoteScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const [note, setNote] = useState<Note>({
    id: params.id as string,
    text: "",
    imageUrls: [],
    mark: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // state for deleted image urls
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);

  // launch image picker
  async function handleImagePicker() {
    const imagePath = await launchImagePicker();
    if (imagePath) {
      setNote((note) => ({
        ...note,
        imageUrls: [...note.imageUrls, imagePath],
      }));
    }
  }

  // fetch note on mount
  useEffect(() => {
    setIsLoading(true);
    // fetch note from Firebase
    async function fetchNote() {
      try {
        if (!user) {
          console.log("No user found");
          return;
        }
        const note = await selectNoteById(params.id as string, user.uid);
        if (note) {
          setNote(note);
        }
      } catch (error) {
        console.log("Error loading note:", error);
        Alert.alert("Error", "Failed to load note", [{ text: "Okay" }]);
      }
      setIsLoading(false);
    }
    fetchNote();
  }, [params.id, user]);

  // update note in Firebase
  async function handleUpdateNote() {
    setIsSaving(true);
    try {
      if (!user) {
        console.log("No user found");
        return;
      }
      await updateNote(note, deletedImageUrls, user.uid);
      router.push("/");
      Alert.alert("Success", "Note saved successfully", [{ text: "OK" }]);
    } catch (error) {
      console.log("Error updating note:", error);
      Alert.alert("Error", "Failed to update note", [{ text: "Okay" }]);
    }
    setIsSaving(false);
  }

  return (
    <View className="flex-1 bg-gray-100 justify-center">
      <Pressable
        className="mb-4 flex-row items-center"
        onPress={() => router.back()}>
        <Text className="text-blue-500 text-lg">← Back</Text>
      </Pressable>
      <View className="p-4 pt-14 mx-auto w-full max-w-md">
        {isSaving && (
          <Text className="text-center text-gray-600 mb-4">Saving...</Text>
        )}
        {isLoading && (
          <Text className="text-center text-gray-600 mb-4">
            Loading note...
          </Text>
        )}
        <View>
          <TextInput
            className="border border-gray-300 mb-4 p-3 rounded-md bg-white shadow-sm w-full"
            placeholder="Enter a note"
            value={note.text}
            onChangeText={(text) => setNote((note) => ({ ...note, text }))}
            multiline
          />
          {note.imageUrls && note.imageUrls.length > 0 && (
            <View className="flex-row flex-wrap mt-5 justify-center">
              {note.imageUrls.map((imagePath, index) => (
                <View key={index} className="relative mr-3 mb-3">
                  <Image
                    source={{ uri: imagePath }}
                    className="w-28 h-28 rounded-md shadow-md"
                  />
                  <Pressable
                    onPress={() => {
                      if (imagePath.includes("https://firebasestorage")) {
                        setDeletedImageUrls((urls) => [...urls, imagePath]);
                      }
                      setNote((note) => ({
                        ...note,
                        imageUrls: note.imageUrls.filter(
                          (path) => path !== imagePath
                        ),
                      }));
                    }}
                    className="absolute -top-2 -right-2 bg-red-600 rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                    <Text className="text-white font-bold">X</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="mt-6 space-y-4 border">
          <Button title="Select Image" onPress={handleImagePicker} />
        </View>

        <Button title="Save" onPress={handleUpdateNote} />

        {note.mark && (
          <Link
            className="mt-9 bg-blue-500 rounded-full p-3 shadow-md mx-auto border"
            href={{
              pathname: "/map",
              params: {
                latitude: note.mark.coordinate.latitude,
                longitude: note.mark.coordinate.longitude,
              },
            }}>
            View in Map
          </Link>
        )}
      </View>
    </View>
  );
}
