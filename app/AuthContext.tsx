import React, { createContext, useState, useEffect, useContext } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "@/firebase";
import { useRouter } from "expo-router";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  login: async (email: string, password: string) => {
    throw new Error("login not implemented");
  },
  register: async (email: string, password: string) => {
    throw new Error("register not implemented");
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // useEffect hook to listen for changes in authentication state
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setLoading(false);
        router.replace("/");
      } else {
        setLoading(false);
        router.replace("/register");
      }
    });

    return unsubscribe;
  }, [user, router]);

  // Function to handle logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log("User logged out");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Function to handle user login
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      console.log("User logged in:", userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.log("Error logging in:", error);
      throw error;
    }
  };

  // Function to handle user registration
  const register = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      console.log("User registered:", userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.log("Error creating user:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, login, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
