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
  const storageRef = ref(storage, `images/${imagePath}`);
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
