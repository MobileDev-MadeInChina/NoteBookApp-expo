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
    recording = null; // Reset recording object
    return uri || null;
  } catch (error) {
    console.error("Failed to stop recording:", error);
    return null;
  }
};

export const playAudio = async (uri: string) => {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();
  } catch (error) {
    console.error("Failed to play audio:", error);
  }
};
