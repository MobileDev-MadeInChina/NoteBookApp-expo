import {
  Alert,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useState, useEffect } from "react";
import { Note, NoteMarker } from "@/types";
import {
  addNote,
  selectNoteByMarkerKey,
  updateNote,
} from "@/services/notesService";
import { launchImagePicker } from "@/services/imagePicker";

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
  // State for deleted image urls
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // State for displaying the note
  const [note, setNote] = useState<Note>({
    id: "",
    text: "",
    imageUrls: [],
    mark: marker,
  });

  // UseEffect to fetch note from Firebase when marker changes
  useEffect(() => {
    setIsLoading(true);
    // fetch note from Firebase
    async function fetchNote() {
      try {
        const note = await selectNoteByMarkerKey(marker.key);
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
  }, [marker.key]);

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
      await updateNote(note, deletedImageUrls);
      Alert.alert("Success", "Note saved successfully", [{ text: "OK" }]);
    } catch (error) {
      console.log("Error updating note:", error);
      Alert.alert("Error", "Failed to update note", [{ text: "Okay" }]);
    }
    // reset the marker and isSaving states
    setShowModal(false);
    setMarker(null);
    setIsSaving(false);
  }

  // add note to Firebase
  async function handleAddNote() {
    setIsSaving(true);
    try {
      await addNote(note);
      Alert.alert("Success", "Note added successfully", [{ text: "OK" }]);
    } catch (error: any) {
      console.log("Error adding note:", error);
      Alert.alert("Error", "Failed to add note", [{ text: "Okay" }]);
    }
    setIsSaving(false);
    setShowModal(false);
    setMarker(null);
  }
  return (
    <Modal animationType="slide" transparent={true} visible={showModal}>
      <View className="flex-1 mt-24 mx-5 bg-white rounded-xl p-6 shadow-lg">
        <Text className="text-2xl font-bold mb-4 text-center">
          Marker Details
        </Text>
        {isLoading && (
          <Text className="text-center text-gray-600 mb-4">
            Loading note...
          </Text>
        )}
        <TextInput
          placeholder="Enter a note"
          value={note.text}
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
        {note.imageUrls.length > 0 ? (
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
        ) : (
          <Text className="text-center text-gray-500 mb-4">
            No images found
          </Text>
        )}
        <View className="flex-row justify-between">
          <Pressable
            className="bg-gray-500 py-2 px-4 rounded-lg flex-1 mr-2"
            onPress={() => {
              setMarker(null);
              setShowModal(false);
            }}>
            <Text className="text-white text-center font-semibold">Cancel</Text>
          </Pressable>
          {isSaving ? (
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
          )}
        </View>
      </View>
    </Modal>
  );
}
