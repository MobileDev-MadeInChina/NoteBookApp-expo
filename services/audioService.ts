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
