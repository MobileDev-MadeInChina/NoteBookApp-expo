import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Text, View, TextInput, TouchableOpacity } from "react-native";
import { useAuth } from "../hooks/useAuth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, login } = useAuth();

  if (user) {
    router.replace("/");
    return null;
  }

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.log("Error logging in:", error);
      Alert.alert("Error", "Failed to login", [{ text: "Okay" }]);
      router.replace("/login");
    }
    setLoading(false);
  };

  return (
    <View className="flex-1 justify-center p-4">
      <Text className="text-2xl font-bold mb-4 text-center">Login</Text>
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
      {loading ? (
        <Text className="text-center text-gray-600 mb-4">Logging in...</Text>
      ) : (
        <TouchableOpacity
          className="bg-blue-500 py-3 rounded-md"
          onPress={handleLogin}>
          <Text className="text-white text-center font-bold">Login</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        className="bg-gray-200 py-3 rounded-md"
        onPress={() => router.push("/register")}>
        <Text className="text-blue-500 text-center font-bold">
          Go to Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}
