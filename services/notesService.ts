import { database } from "@/firebase";
import { Note } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  deleteImage,
  deleteVoiceNote,
  uploadImage,
} from "./storageService";

// fetch note from Firebase by id
export async function selectNoteById(id: string, userId: string) {
  try {
    const noteDoc = await getDoc(doc(collection(database, userId), id));

    if (!noteDoc.exists()) {
      console.log("No note found");
      return;
    }

    const note: Note = {
      id: noteDoc.id,
      text: noteDoc.get("text"),
      imageUrls: noteDoc.get("imageUrls"),
      mark: noteDoc.get("mark"),
      voiceNoteUrl: noteDoc.get("voiceNoteUrl") || null, // Fetch voice note URL
    };

    return note;
  } catch (error) {
    console.log("Error loading note:", error);
  }
}

// Fetch note from Firebase by marker key
export async function selectNoteByMarkerKey(key: string, userId: string) {
  try {
    const noteDoc = await getDoc(doc(collection(database, userId), key));

    if (!noteDoc.exists()) {
      console.log("No note found");
      return;
    }

    const note: Note = {
      id: noteDoc.id,
      text: noteDoc.get("text"),
      imageUrls: noteDoc.get("imageUrls"),
      mark: noteDoc.get("mark"),
      voiceNoteUrl: noteDoc.get("voiceNoteUrl") || null, // Fetch voice note URL
    };

    return note;
  } catch (error) {
    console.log("Error loading note:", error);
  }
}

// add note to Firebase
export async function addNote(note: Note, userId: string) {
  try {
    // Upload images to Firebase Storage and get URLs
    const promises = note.imageUrls.map(async (imageUrl) => {
      return await uploadImage(imageUrl);
    });
    const urls = await Promise.all(promises);

    // Add note to Firebase, including the voiceNoteUrl if available
    await addDoc(collection(database, userId), {
      text: note.text,
      imageUrls: urls,
      mark: note.mark,
      voiceNoteUrl: note.voiceNoteUrl,
    });
  } catch (error) {
    console.error("Error adding note:", error);
    throw error;
  }
}

// update note in Firebase
export async function updateNote(
  note: Note,
  deletedImageUrls: string[],
  userId: string
) {
  try {
    // Initialize imageUrls array
    let imageUrls: string[] = [];

    // Iterate through the imageUrls array and upload or add the image URLs to the note
    if (note.imageUrls && note.imageUrls.length > 0) {
      for (let i = 0; i < note.imageUrls.length; i++) {
        const imagePath = note.imageUrls[i];
        if (imagePath.includes("https://firebasestorage")) {
          // If the imagePath is a Firebase Storage URL, then it is already saved in Firebase Storage
          imageUrls.push(imagePath);
        } else {
          // If not a Firebase Storage URL, upload it to Firebase Storage and get the URL
          const imageUrl = await uploadImage(imagePath);
          imageUrls.push(imageUrl);
        }
      }
    }

    // Update the note in Firebase, including the voiceNoteUrl
    await updateDoc(doc(collection(database, userId), note.id), {
      text: note.text,
      imageUrls,
      mark: note.mark,
      voiceNoteUrl: note.voiceNoteUrl,
    });

    // Delete removed images from storage
    const promises = deletedImageUrls.map(async (imageUrl) => {
      await deleteImage(imageUrl);
    });
    await Promise.all(promises);
  } catch (error) {
    console.log("Error updating note:", error);
  }
}

// delete note from Firebase
export const deleteNote = async (note: Note, userId: string) => {
  try {
    // Delete images from storage before deleting note from Firebase
    const promises = note.imageUrls.map(async (imageUrl) => {
      await deleteImage(imageUrl);
    });
    await Promise.all(promises);

    // Delete the note's voice note file from Firebase Storage if it exists
    if (note.voiceNoteUrl) {
      await deleteVoiceNote(note.voiceNoteUrl);
    }

    // Delete the note from Firebase
    await deleteDoc(doc(collection(database, userId), note.id));
  } catch (error) {
    console.log("Error deleting note:", error);
  }
};
