import { database } from "@/firebase";
import { Link, Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { updateDoc, collection, doc, getDoc } from "firebase/firestore";
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
import * as ImagePicker from "expo-image-picker";
import { storage } from "@/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getStorage,
} from "firebase/storage";
import { Note } from "@/types";
import "../../global.css";

export default function NoteScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [note, setNote] = useState<Note>({
    id: params.id as string,
    text: "",
    imageUrls: [],
    mark: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // state for deleted image urls
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);

  // launch image picker
  async function launchImagePicker() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setNote((note) => ({
        ...note,
        imageUrls: [...note.imageUrls, result.assets[0].uri],
      }));
    }
  }

  // upload image to Firebase Storage
  async function uploadImage(imagePath: string): Promise<string> {
    const res = await fetch(imagePath);
    const blob = await res.blob();
    const storageRef = ref(storage, `images/${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob).then((snapshot) => {
      console.log("Uploaded a blob or file!", snapshot);
    });

    return getDownloadURL(storageRef);
  }

  // fetch note from Firebase
  const loadNote = async () => {
    setIsLoading(true);
    try {
      const noteDoc = await getDoc(doc(collection(database, "notes"), note.id));

      if (!noteDoc.exists()) {
        console.log("No note found");
        return;
      }
      // update the note state with the fetched data
      setNote((note) => ({
        ...note,
        text: noteDoc.get("text"),
        imageUrls: noteDoc.get("imageUrls") || [],
        mark: noteDoc.get("mark"),
      }));
    } catch (error) {
      console.log("Error loading note:", error);
      Alert.alert("Error", "Failed to load note", [{ text: "Okay" }]);
    }
    setIsLoading(false);
  };
  // update note in Firebase
  const updateNote = async () => {
    setIsSaving(true);
    try {
      // initialize imageUrls array
      let imageUrls: string[] = [];
      // iterate through the imageUrls array and upload or add the image URLs to the note
      if (note.imageUrls && note.imageUrls.length > 0) {
        for (let i = 0; i < note.imageUrls.length; i++) {
          const imagePath = note.imageUrls[i];
          if (!imagePath.includes("http")) {
            // if not a URL, upload it to Firebase Storage and get the URL
            const imageUrl = await uploadImage(imagePath);
            imageUrls.push(imageUrl);
          } else {
            // if it's a URL, just add it to the array
            imageUrls.push(imagePath);
          }
        }
      }

      // update the note in Firebase
      await updateDoc(doc(collection(database, "notes"), note.id), {
        text: note.text,
        imageUrls,
      });

      // delete removed images from storage
      await Promise.all(
        deletedImageUrls.map(async (imageUrl) => {
          await deleteImage(imageUrl);
        })
      );
      // redirect to home screen
      Redirect({ href: "/" });
    } catch (error) {
      console.log("Error updating note:", error);
      Alert.alert("Error", "Failed to update note", [{ text: "Okay" }]);
    }
    setIsSaving(false);
  };
  // delete image from Firebase Storage
  const deleteImage = async (imageUrl: string) => {
    try {
      const response = await deleteObject(ref(getStorage(), imageUrl));
      console.log("Deleted image:", response);
    } catch (error) {
      console.log("Error deleting image:", error);
      Alert.alert("Error", "Failed to delete image in storage", [
        { text: "Okay" },
      ]);
    }
  };
  // toggle editing state
  const editNote = () => {
    setIsEditing(!isEditing);
  };
  // fetch note on mount
  useEffect(() => {
    loadNote();
  }, []);

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
        {isEditing ? (
          <View>
            <TextInput
              className="h-28 border border-gray-300 mb-4 p-3 rounded-md bg-white shadow-sm w-full"
              placeholder="Enter a note"
              value={note.text}
              onChangeText={(text) => setNote((note) => ({ ...note, text }))}
              multiline
            />
            <Pressable
              className="p-3 bg-red-500 rounded-full mb-4 shadow-md"
              onPress={editNote}>
              <Text className="text-white text-center font-medium">Cancel</Text>
            </Pressable>
            <Pressable
              className="p-3 bg-green-500 rounded-full mt-4 shadow-md"
              onPress={updateNote}>
              <Text className="text-white text-center font-medium">Save</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <Text className="text-lg font-semibold mb-4 text-center">
              {note.text}
            </Text>
            <Button title="Edit Text" onPress={editNote} />

            <View className="mt-6 space-y-4">
              <Button title="Select Image" onPress={launchImagePicker} />
              <Button title="Save" onPress={updateNote} />
            </View>
            {note.mark && (
              <Link
                className="mt-5 bg-blue-500 rounded-full p-3 shadow-md mx-auto"
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
                        if (imagePath.includes("http")) {
                          setDeletedImageUrls((urls) => [...urls, imagePath]);
                          setNote((note) => ({
                            ...note,
                            imageUrls: note.imageUrls.filter(
                              (_, i) => i !== index
                            ),
                          }));
                        } else {
                          setNote((note) => ({
                            ...note,
                            imageUrls: note.imageUrls.filter(
                              (_, i) => i !== index
                            ),
                          }));
                        }
                      }}
                      className="absolute -top-2 -right-2 bg-red-600 rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                      <Text className="text-white font-bold">X</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
