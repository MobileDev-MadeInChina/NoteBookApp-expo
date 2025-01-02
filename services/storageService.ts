import { storage } from "@/firebase";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";

// upload image to Firebase Storage
export async function uploadImage(imagePath: string): Promise<string> {
  const res = await fetch(imagePath);
  const blob = await res.blob();
  const storageRef = ref(storage, `images/${Date.now()}.jpg`);
  await uploadBytes(storageRef, blob).then((snapshot) => {
    console.log("Uploaded a blob or file!", snapshot);
  });

  return getDownloadURL(storageRef);
}
// delete image from Firebase Storage
export async function deleteImage(imageUrl: string) {
  try {
    await deleteObject(ref(getStorage(), imageUrl));
    console.log("Deleted image:", imageUrl);
  } catch (error) {
    console.log("Error deleting image:", error);
  }
}

// Upload voice note
export async function uploadVoiceNote(voiceNotePath: string): Promise<string> {
  const res = await fetch(voiceNotePath);
  const blob = await res.blob();
  const storageRef = ref(storage, `voiceNotes/${Date.now()}.mp3`);
  await uploadBytes(storageRef, blob).then((snapshot) => {
    console.log("Uploaded a blob or file!", snapshot);
  });

  return getDownloadURL(storageRef);
}

// Delete voice note from Firebase Storage
export async function deleteVoiceNote(voiceNoteUrl: string) {
  try {
    await deleteObject(ref(getStorage(), voiceNoteUrl));
    console.log("Deleted voice note:", voiceNoteUrl);
  } catch (error) {
    console.log("Error deleting voice note:", error);
  }
}
