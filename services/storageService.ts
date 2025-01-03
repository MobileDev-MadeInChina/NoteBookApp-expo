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
  try {
    console.log("Input voice note path:", voiceNotePath);

    // Only proceed with fetch if it's a local file
    if (!voiceNotePath.startsWith("http")) {
      const response = await fetch(voiceNotePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch voice note: ${response.status}`);
      }

      const blob = await response.blob();
      console.log("Blob size:", blob.size);

      // Extract the original file extension from the path
      const fileName = `voiceNotes/${Date.now()}.m4a`;

      const storageRef = ref(storage, fileName);
      const metadata = {
        contentType: `audio/x-m4a`, // Set proper content type
      };
      const snapshot = await uploadBytes(storageRef, blob, metadata);
      console.log("Uploaded voice note:", snapshot);

      // Wait for the download URL and make sure it resolves
      const downloadUrl = await getDownloadURL(storageRef);
      console.log("Download URL:", downloadUrl);

      if (!downloadUrl) {
        throw new Error("Failed to get download URL");
      }
      return downloadUrl;
    } else {
      console.log("File is already uploaded, returning existing URL");
      return voiceNotePath;
    }
  } catch (error) {
    console.error("Error uploading voice note:", error);
    throw error;
  }
}

// Delete voice note from Firebase Storage
export async function deleteVoiceNote(voiceNoteUrl: string) {
  try {
    // Extract the actual path from the URL
    const decodedUrl = decodeURIComponent(voiceNoteUrl);
    const urlObj = new URL(decodedUrl);
    const pathWithToken = urlObj.pathname.split("/o/")[1];
    const path = pathWithToken.split("?")[0];

    console.log("Attempting to delete file at path:", path);

    const storageRef = ref(storage, decodeURIComponent(path));
    await deleteObject(storageRef);
    console.log("Successfully deleted voice note at path:", path);
  } catch (error) {
    console.log("Error deleting voice note:", error);
  }
}
