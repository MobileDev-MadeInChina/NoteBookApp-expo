import { LatLng } from "react-native-maps";

// types/index.ts
export type Note = {
  id: string;
  text: string | null; // to allow the user to choose between text or voice note
  imageUrls: string[];
  mark: NoteMarker | null;
  voiceNoteUrl?: string; // Add optional field for voice note URL
};

export type NoteMarker = {
  coordinate: LatLng;
  key: string;
  title: string;
  voiceNoteUrl?: string;
};