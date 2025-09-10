import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { SignUpParams, SignInParams, User, AuthResponse } from "../types/auth";

export async function signUp(params: SignUpParams): Promise<AuthResponse> {
  try {
    const { name, email, password } = params;

    console.log("Starting sign up process for:", email);

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    console.log("Firebase Auth user created:", firebaseUser.uid);

    // Save user data to Firestore
    const userData: User = {
      id: firebaseUser.uid,
      name,
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("Attempting to save user data to Firestore:", userData);
    await setDoc(doc(db, "users", firebaseUser.uid), userData);
    console.log("User data saved to Firestore successfully");

    return {
      success: true,
      user: userData
    };
  } catch (error) {
    console.error("Sign up error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function signIn(params: SignInParams): Promise<AuthResponse> {
  try {
    const { email, password } = params;

    console.log("Starting sign in process for:", email);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    console.log("Firebase Auth sign in successful:", firebaseUser.uid);

    // Get user data from Firestore
    console.log("Attempting to fetch user data from Firestore");
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

    if (!userDoc.exists()) {
      console.error("User document not found in Firestore");
      return {
        success: false,
        error: "User data not found"
      };
    }

    const userData = userDoc.data() as User;
    console.log("User data fetched successfully:", userData);

    return {
      success: true,
      user: userData
    };
  } catch (error) {
    console.error("Sign in error:", error);
    console.error("Error details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      return null;
    }

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data() as User;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}
