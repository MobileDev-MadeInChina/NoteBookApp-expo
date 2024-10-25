import { database } from "@/firebase";
import { Note } from "@/types";
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { deleteImage, uploadImage } from "./storageService";

// fetch note from Firebase by id
export async function selectNoteById(id: string) {
  try {
    const noteDoc = await getDoc(doc(collection(database, "notes"), id));

    if (!noteDoc.exists()) {
      console.log("No note found");
      return;
    }
    const note: Note = {
      id: noteDoc.id,
      text: noteDoc.get("text"),
      imageUrls: noteDoc.get("imageUrls"),
      mark: noteDoc.get("mark"),
    };
    console.log("Fetched imageurls: ", note.imageUrls);

    return note;
  } catch (error) {
    console.log("Error loading note:", error);
  }
}

// Fetch note from Firebase by marker key
export async function selectNoteByMarkerKey(key: string) {
  try {
    const noteDoc = await getDoc(doc(collection(database, "notes"), key));

    if (!noteDoc.exists()) {
      console.log("No note found");
      return;
    }
    const note: Note = {
      id: noteDoc.id,
      text: noteDoc.get("text"),
      imageUrls: noteDoc.get("imageUrls"),
      mark: noteDoc.get("mark"),
    };
    console.log("Fetched imageurls: ", note.imageUrls);

    return note;
  } catch (error) {
    console.log("Error loading note:", error);
  }
}

// add note to Firebase
export async function addNote(note: Note) {
  try {
    await addDoc(collection(database, "notes"), {
      text: note.text,
      imageUrls: note.imageUrls,
      mark: note.mark,
    });
  } catch (error) {
    console.error("Error adding note:", error);
  }
}

// update note in Firebase
export async function updateNote(note: Note, deletedImageUrls: string[]) {
  try {
    // initialize imageUrls array
    let imageUrls: string[] = [];
    // iterate through the imageUrls array and upload or add the image URLs to the note
    if (note.imageUrls && note.imageUrls.length > 0) {
      for (let i = 0; i < note.imageUrls.length; i++) {
        const imagePath = note.imageUrls[i];
        if (imagePath.includes("https://firebasestorage")) {
          // if the imagePath is a Firebase Storage URL, then it is already saved in Firebase Storage
          imageUrls.push(imagePath);
        } else {
          // if not a Firebase Storage URL, upload it to Firebase Storage and get the URL
          const imageUrl = await uploadImage(imagePath);
          imageUrls.push(imageUrl);
        }
      }
    }
    console.log("imageURL's to update: ", imageUrls);

    // update the note in Firebase
    await updateDoc(doc(collection(database, "notes"), note.id), {
      text: note.text,
      imageUrls,
    });

    // delete removed images from storage
    const promises = deletedImageUrls.map(async (imageUrl) => {
      await deleteImage(imageUrl);
    });
    await Promise.all(promises);
  } catch (error) {
    console.log("Error updating note:", error);
  }
}
