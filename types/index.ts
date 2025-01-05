import { LatLng } from "react-native-maps";

// types/index.ts
export type Note = {
  id: string;
  text: string;
  imageUrls: string[];
  mark: NoteMarker;
  voiceNoteUrl: string;
};

export type NoteMarker = {
  coordinate: LatLng;
  key: string;
  title: string;
};
