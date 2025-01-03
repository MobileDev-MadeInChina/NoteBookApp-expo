import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { Alert, Text, TouchableOpacity } from "react-native";

export default function LogoutButton() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  }

  return (
    <TouchableOpacity
      className="bg-red-500 py-3 rounded-md"
      onPress={handleLogout}>
      <Text className="text-white text-center font-bold">
        {" "}
        Logout: {user?.email}
      </Text>
    </TouchableOpacity>
  );
}
