import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Text, View, TextInput, TouchableOpacity } from "react-native";
import { useAuth } from "./AuthContext";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, register } = useAuth();

  // If user is already logged in, redirect to home
  if (user) {
    router.replace("/");
    return null;
  }

  const handleRegister = async () => {
    setLoading(true);
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match", [{ text: "Okay" }]);
      setLoading(false);
      return;
    }
    try {
      const userCredential = await register(email, password);
      console.log("User registered:", userCredential);
      // Redirect to home screen
      router.push("/");
      Alert.alert(`Welcome ${userCredential.email}`, "You are now registred", [
        { text: "Okay" },
      ]);
    } catch (error) {
      console.log("Error creating user:", error);
      Alert.alert("Error", "Failed to register", [{ text: "Okay" }]);
      router.replace("/register");
    }
    setLoading(false);
  };

  return (
    <View className="flex-1 justify-center p-4">
      <Text className="text-2xl font-bold mb-4 text-center">Register</Text>
      <TextInput
        className="h-12 border border-gray-300 rounded-md mb-4 px-4"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        className="h-12 border border-gray-300 rounded-md mb-4 px-4"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        className="h-12 border border-gray-300 rounded-md mb-4 px-4"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      {loading ? (
        <Text className="text-center text-gray-600 mb-4">Registering...</Text>
      ) : (
        <TouchableOpacity
          className="bg-blue-500 py-3 rounded-md mb-2"
          onPress={handleRegister}>
          <Text className="text-white text-center font-bold">Register</Text>
        </TouchableOpacity>
      )}
      <Text className="m-4 text-center">or</Text>
      <TouchableOpacity
        className="bg-gray-200 py-3 rounded-md"
        onPress={() => router.push("/login")}>
        <Text className="text-blue-500 text-center font-bold">Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
}
