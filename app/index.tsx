import React, { useEffect, useState } from "react";
import { Text, View, ScrollView, Alert, Pressable, Image } from "react-native";
import { Link, useRouter } from "expo-router";
import { database } from "../firebase";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { Note } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { deleteNote } from "@/services/notesService";
import { useAuth } from "./AuthContext";
import { getAuth, signOut } from "firebase/auth";

export default function HomeScreen() {
  // useCollection hook to fetch notes from Firebase
  const [values, loading, error] = useCollection(collection(database, "notes"));
  // state for deleting note
  const [deletingNote, setDeletingNote] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/register");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <Text>Loading user...</Text>;
  }

  if (values === undefined) {
    return null;
  }

  // map Firebase documents to Note objects
  const data: Note[] = values.docs.map((doc) => ({
    id: doc.id,
    text: doc.data().text,
    imageUrls: doc.data().imageUrls,
    mark: doc.data().mark,
  }));

  // delete note from Firebase
  async function handleDeleteNote(note: Note) {
    setDeletingNote(true);
    try {
      await deleteNote(note);
      Alert.alert("Success", "Note deleted successfully", [{ text: "OK" }]);
    } catch (error) {
      console.log("Error deleting note:", error);
      Alert.alert("Error", "Failed to delete note", [{ text: "Okay" }]);
    }
    setDeletingNote(false);
  }

  async function handleLogout() {
    try {
      await signOut(getAuth());
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1">
        <View className="bg-white shadow-md py-4">
          <View className="flex-row justify-between items-center px-4">
            <Text className="text-2xl font-bold text-gray-800">My Notes</Text>
            <Pressable
              className="bg-blue-500 px-4 py-2 rounded-full"
              onPress={() => router.push("/map")}>
              <Text className="text-white font-semibold">Map</Text>
            </Pressable>
          </View>
        </View>

        {loading && (
          <Text className="text-center text-gray-600 mt-4">
            Loading notes...
          </Text>
        )}
        {error && (
          <Text className="text-center text-red-500 mt-4">
            Error: {error.message}
          </Text>
        )}

        <ScrollView className="flex-1 px-4 pt-2">
          {data &&
            data.map((note, index) => (
              <View
                key={index}
                className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
                <Link
                  href={{ pathname: "/notes/[id]", params: { id: note.id } }}>
                  <View className="p-4">
                    <Text className="text-lg text-gray-800 mb-2">
                      {note.text.length > 50
                        ? `${note.text.slice(0, 50)}...`
                        : note.text}
                    </Text>

                    {note.imageUrls.length > 0 && (
                      <View className="flex-row flex-wrap">
                        {note.imageUrls.map((imageUrl, imgIndex) => (
                          <Image
                            key={imgIndex}
                            source={{ uri: imageUrl }}
                            className="w-16 h-16 rounded-xl mr-2 mb-2"
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </Link>

                <View className="bg-gray-50 px-4 py-3 flex-row justify-between items-center">
                  <Link
                    className="bg-blue-500 rounded-full px-4 py-2 shadow-md"
                    href={{
                      pathname: "/map",
                      params: {
                        latitude: note.mark?.coordinate.latitude,
                        longitude: note.mark?.coordinate.longitude,
                      },
                    }}>
                    <Text className="text-white font-semibold">
                      View in Map
                    </Text>
                  </Link>
                  {deletingNote ? (
                    <Text className="text-gray-600">Deleting...</Text>
                  ) : (
                    <Pressable
                      onPress={() => handleDeleteNote(note)}
                      className="bg-red-500 px-4 py-2 rounded-full">
                      <Text className="text-white font-semibold">Delete</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
        </ScrollView>
        {/* Logout button */}
        <View className="absolute bottom-4 left-0 right-0 items-center">
          <Pressable
            className="bg-red-500 px-6 py-3 rounded-full shadow-md"
            onPress={handleLogout}>
            <Text className="text-white font-semibold">
              Logout: {user?.email}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
