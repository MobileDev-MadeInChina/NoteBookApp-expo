import {
  Alert,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Note, NoteMarker } from "@/types";
import {
  addNote,
  selectNoteByMarkerKey,
  updateNote,
} from "@/services/notesService";
import { launchImagePicker } from "@/services/imagePicker";
import { useAuth } from "@/app/AuthContext";
import {
  handleVoiceNoteRecording,
  playAudio,
  startRecording,
} from "@/services/audioService";
import { Audio } from "expo-av";

// Modal to display the marker details and get user input
export function MarkerModal({
  marker,
  setMarker,
  showModal,
  setShowModal,
}: {
  marker: NoteMarker;
  setMarker: React.Dispatch<React.SetStateAction<NoteMarker | null>>;
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  // Get the user from the auth context
  const { user } = useAuth();
  // State to manage deleted image URLs
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Loading state for fetching notes
  const [isSaving, setIsSaving] = useState(false); // Saving state for adding/updating notes
  const [recording, setRecording] = useState(false); // Recording state for voice notes
  // State for the sound object
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTainted, setIsTainted] = useState(false);
  // Using a ref to store the original note
  const originalNote = useRef<Note | null>(null);

  // Initialize note state with default values
  const [note, setNote] = useState<Note>({
    id: "",
    text: "",
    imageUrls: [],
    mark: marker,
    voiceNoteUrl: "",
  });

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

  // Fetch note from Firebase when marker changes
  useEffect(() => {
    setIsLoading(true);

    async function fetchNote() {
      try {
        if (!user) {
          console.log("No user found");
          return;
        }
        const fetchedNote = await selectNoteByMarkerKey(marker.key, user.uid);
        if (fetchedNote) {
          setNote(fetchedNote); // Set note data if available
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
  }, [marker.key, user]);

  // Handle image picker functionality
  async function handleImagePicker() {
    const imagePath = await launchImagePicker();
    if (imagePath) {
      setNote((note) => ({
        ...note,
        imageUrls: [...note.imageUrls, imagePath],
      }));
    }
  }

  // Add a new note to Firebase
  async function handleAddNote() {
    setIsSaving(true);
    try {
      if (!user) {
        console.log("No user found");
        return;
      }
      await addNote(note, user.uid); // Add note to Firebase
      Alert.alert("Success", "Note added successfully", [{ text: "OK" }]);
    } catch (error) {
      console.log("Error adding note:", error);
      Alert.alert("Error", "Failed to add note", [{ text: "Okay" }]);
    }
    setIsSaving(false);
    setShowModal(false);
    setMarker(null); // Reset modal state
  }

  // Update an existing note in Firebase
  async function handleUpdateNote() {
    setIsSaving(true);
    try {
      if (!user) {
        console.log("No user found");
        return;
      }
      await updateNote(note, deletedImageUrls, user.uid); // Update note in Firebase
      Alert.alert("Success", "Note updated successfully", [{ text: "OK" }]);
    } catch (error) {
      console.log("Error updating note:", error);
      Alert.alert("Error", "Failed to update note", [{ text: "Okay" }]);
    }
    setMarker(null); // Reset modal state
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
    <Modal animationType="slide" transparent={true} visible={showModal}>
      <View className="flex-1 mt-24 mx-5 bg-white rounded-xl p-6 shadow-lg">
        <Text className="text-2xl font-bold mb-4 text-center">
          Marker Details
        </Text>
        {isLoading ? (
          <Text className="text-center text-gray-600 mb-4">
            Loading note...
          </Text>
        ) : (
          <View>
            <TextInput
              placeholder="Enter a note"
              value={note.text ?? ""}
              onChangeText={(text) => setNote((prev) => ({ ...prev, text }))}
              className="border border-gray-300 rounded-lg p-3 mb-4"
            />
            <Pressable
              onPress={handleImagePicker}
              className="bg-blue-500 py-2 px-4 rounded-lg mb-4">
              <Text className="text-white text-center font-semibold">
                Select Image
              </Text>
            </Pressable>
            {note.imageUrls.length > 0 && (
              <View className="mb-4">
                {note.imageUrls.map((imagePath, index) => (
                  <View key={index} className="flex-row items-center mb-3">
                    <Image
                      source={{ uri: imagePath }}
                      className="w-24 h-24 rounded-md mr-3"
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
                      className="bg-red-500 py-2 px-3 rounded-lg">
                      <Text className="text-white">Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            <View className="flex-row justify-between">
              {/* Voice Note Recording Button */}
              <Pressable
                onPress={recording ? handleStopRecording : handleStartRecording}
                className="bg-orange-500 py-2 px-4 rounded-lg flex-1 mr-2">
                <Text className="text-white text-center font-semibold">
                  {recording ? "Stop Recording" : "Record Voice Note"}
                </Text>
              </Pressable>

              {/* Play Voice Note Button */}
              {note.voiceNoteUrl && (
                <Pressable
                  onPress={handlePlayAudio}
                  disabled={isPlaying}
                  className={`bg-purple-500 py-2 px-4 rounded-lg flex-1 ml-2 ${
                    isPlaying ? "opacity-75" : ""
                  }`}>
                  <Text className="text-white text-center font-semibold">
                    {isPlaying ? "Playing..." : "Play Voice Note"}
                  </Text>
                </Pressable>
              )}
            </View>
            <View className="flex-row justify-between mt-4">
              <Pressable
                className="bg-gray-500 py-2 px-4 rounded-lg flex-1 mr-2"
                onPress={() => {
                  setMarker(null);
                  setShowModal(false);
                }}>
                <Text className="text-white text-center font-semibold">
                  Close
                </Text>
              </Pressable>
              {isTainted &&
                (isSaving ? (
                  <View className="bg-green-500 py-2 px-4 rounded-lg flex-1 ml-2">
                    <Text className="text-white text-center font-semibold">
                      Saving...
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    className="bg-green-500 py-2 px-4 rounded-lg flex-1 ml-2"
                    onPress={() =>
                      note.id !== "" ? handleUpdateNote() : handleAddNote()
                    }>
                    <Text className="text-white text-center font-semibold">
                      {note.id !== "" ? "Update" : "Save"}
                    </Text>
                  </Pressable>
                ))}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
