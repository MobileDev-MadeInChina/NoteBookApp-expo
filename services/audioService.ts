import { Audio } from "expo-av";

let recording: Audio.Recording | null = null;

export const startRecording = async () => {
  try {
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status !== "granted") {
      throw new Error("Audio recording permissions not granted");
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    recording = new Audio.Recording();
    await recording.prepareToRecordAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    await recording.startAsync();
  } catch (error) {
    console.error("Failed to start recording:", error);
  }
};

export const stopRecording = async (): Promise<string | null> => {
  try {
    if (!recording) return null;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log("Recording URI after stop:", uri);
    recording = null; // Reset recording object
    return uri || null;
  } catch (error) {
    console.error("Failed to stop recording:", error);
    return null;
  }
};

export const handleVoiceNoteRecording = async (
  note: { voiceNoteUrl: string },
  setNote: (note: any) => void,
  setRecording: (recording: boolean) => void,
  deleteVoiceNote: (url: string) => Promise<void>,
  uploadVoiceNote: (uri: string) => Promise<string>
) => {
  try {
    const uri = await stopRecording();
    if (uri) {
      console.log("New recording URI:", uri);
      // Upload the new recording to Firebase Storage
      const uploadedUrl = await uploadVoiceNote(uri);
      console.log("Uploaded URL:", uploadedUrl);

      // Only delete the old recording if it exists and is different
      if (note.voiceNoteUrl && note.voiceNoteUrl !== uploadedUrl) {
        await deleteVoiceNote(note.voiceNoteUrl);
      }

      // Update the note with the new URL
      setNote((prev: any) => ({ ...prev, voiceNoteUrl: uploadedUrl }));
    }
  } catch (error) {
    console.error("Error handling recording:", error);
    throw error;
  } finally {
    setRecording(false);
  }
};

export const playAudio = async (
  voiceNoteUrl: string,
  setSound: (sound: Audio.Sound | null) => void,
  setIsPlaying: (isPlaying: boolean) => void
) => {
  try {
    // Configure audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Clean the URL if it's encoded multiple times
    const cleanUri = decodeURIComponent(voiceNoteUrl);
    console.log("Playing audio from cleaned URI:", cleanUri);

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: cleanUri },
      { shouldPlay: true },
      (status) => console.log("Loading status:", status)
    );
    setSound(newSound);

    // Add status listener for playback completion
    newSound.setOnPlaybackStatusUpdate((status) => {
      if ("isLoaded" in status && status.isLoaded) {
        if (status.didJustFinish) {
          setIsPlaying(false);
          newSound.unloadAsync();
          setSound(null);
        }
      }
    });

    const playbackStatus = await newSound.playAsync();
    console.log("Playback status:", playbackStatus);
  } catch (error) {
    console.error("Error playing audio:", error);
    throw error;
  }
};
