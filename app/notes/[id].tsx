import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, TextInput, View, Image } from "react-native";
import { Note } from "@/types";
import { launchImagePicker } from "@/services/imagePicker";
import { selectNoteById, updateNote } from "@/services/notesService";
import { useAuth } from "../AuthContext";
import { Audio } from "expo-av";
import {
  handleVoiceNoteRecording,
  playAudio,
  startRecording,
} from "@/services/audioService";

export default function NoteScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const [note, setNote] = useState<Note>({
    id: params.id as string,
    text: "",
    imageUrls: [],
    mark: null,
    voiceNoteUrl: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // state for deleted image urls
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
  const [recording, setRecording] = useState(false); // Recording state for voice notes
  // State for the sound object
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTainted, setIsTainted] = useState(false);
  // Using a ref to store the original note
  const originalNote = useRef<Note | null>(null);

  // Set isTainted state to true if the any note field is changed
  useEffect(() => {
    if (!originalNote.current) return;

    const hasChanged =
      note.text !== originalNote.current.text ||
      note.voiceNoteUrl !== originalNote.current.voiceNoteUrl ||
      JSON.stringify(note.imageUrls) !==
        JSON.stringify(originalNote.current.imageUrls);

    setIsTainted(hasChanged);
  }, [note]);

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
        const fetchedNote = await selectNoteById(params.id as string, user.uid);
        if (fetchedNote) {
          setNote(fetchedNote);
          originalNote.current = fetchedNote; // Store original note
          setIsTainted(false);
        }
      } catch (error) {
        console.log("Error loading note:", error);
        Alert.alert("Error", "Failed to load note", [{ text: "Okay" }]);
      }
      setIsLoading(false);
    }
    fetchNote();
  }, [params.id, user]);

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
  // Handle start of audio recording
  const handleStartRecording = async () => {
    await startRecording();
    setRecording(true);
  };

  // Handle stop of audio recording and save the URI
  const handleStopRecording = async () => {
    try {
      await handleVoiceNoteRecording(note, setNote, setRecording);
    } catch (error) {
      console.error("Error handling recording:", error);
      Alert.alert("Error", "Failed to save recording");
    }
  };

  // Play the recorded audio note
  const handlePlayAudio = async () => {
    if (note.voiceNoteUrl) {
      try {
        await playAudio(note.voiceNoteUrl, setSound, setIsPlaying);
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    } else {
      Alert.alert("Error", "No voice note recorded");
      setRecording(false);
    }
  };

  // Cleanup sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
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

        <View className="mt-6 space-y-4">
          {/* Image and Recording Controls */}
          <View className="space-y-3">
            {/* Image Button */}
            <Pressable
              onPress={handleImagePicker}
              className="bg-blue-500 py-3 px-4 rounded-lg shadow-sm active:bg-blue-600">
              <Text className="text-white text-center font-semibold">
                Add Image
              </Text>
            </Pressable>

            {/* Voice Controls */}
            <View className="flex-row space-x-3">
              <Pressable
                onPress={recording ? handleStopRecording : handleStartRecording}
                className={`flex-1 py-3 px-4 rounded-lg shadow-sm ${
                  recording
                    ? "bg-red-500 active:bg-red-600"
                    : "bg-orange-500 active:bg-orange-600"
                }`}>
                <Text className="text-white text-center font-semibold">
                  {recording ? "Stop Recording" : "Record Voice"}
                </Text>
              </Pressable>

              {note.voiceNoteUrl && (
                <Pressable
                  onPress={handlePlayAudio}
                  disabled={isPlaying}
                  className={`flex-1 py-3 px-4 rounded-lg shadow-sm ${
                    isPlaying
                      ? "bg-purple-400"
                      : "bg-purple-500 active:bg-purple-600"
                  }`}>
                  <Text className="text-white text-center font-semibold">
                    {isPlaying ? "Playing..." : "Play Voice"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mt-4">
            {isTainted && (
              <Pressable
                disabled={isSaving}
                onPress={handleUpdateNote}
                className={`py-3 px-4 rounded-lg shadow-sm ${
                  isSaving ? "bg-green-400" : "bg-green-500 active:bg-green-600"
                }`}>
                <Text className="text-white text-center font-semibold">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Text>
              </Pressable>
            )}

            {note.mark && (
              <Link
                className="bg-blue-500 rounded-full px-4 py-2 shadow-md"
                href={{
                  pathname: "/map",
                  params: {
                    latitude: note.mark?.coordinate.latitude,
                    longitude: note.mark?.coordinate.longitude,
                  },
                }}>
                <Text className="text-white font-semibold">View in Map</Text>
              </Link>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
