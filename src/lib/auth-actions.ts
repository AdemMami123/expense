import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { SignUpParams, SignInParams, User, AuthResponse } from "../types/auth";

// Helper function to convert Firebase error codes to user-friendly messages
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'permission-denied':
      return 'Permission denied. Please check your account permissions.';
    case 'unavailable':
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
}

export async function signUp(params: SignUpParams): Promise<AuthResponse> {
  try {
    const { name, email, password } = params;

    // Input validation
    if (!name?.trim()) {
      return {
        success: false,
        error: "Name is required"
      };
    }

    if (!email?.trim()) {
      return {
        success: false,
        error: "Email is required"
      };
    }

    if (!password) {
      return {
        success: false,
        error: "Password is required"
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long"
      };
    }

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

    // Handle Firebase Auth errors
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      // Provide user-friendly error messages
      const errorMessage = getAuthErrorMessage(error.code as string);
      return {
        success: false,
        error: errorMessage
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}

export async function signIn(params: SignInParams): Promise<AuthResponse> {
  try {
    const { email, password } = params;

    // Input validation
    if (!email?.trim()) {
      return {
        success: false,
        error: "Email is required"
      };
    }

    if (!password) {
      return {
        success: false,
        error: "Password is required"
      };
    }

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

    // Handle Firebase Auth errors
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      // Provide user-friendly error messages
      const errorMessage = getAuthErrorMessage(error.code as string);
      return {
        success: false,
        error: errorMessage
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}

export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    await signOut(auth);
    console.log("User logged out successfully");
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);

    // Handle Firebase Auth errors
    if (error && typeof error === 'object' && 'code' in error) {
      const errorMessage = getAuthErrorMessage(error.code as string);
      return {
        success: false,
        error: errorMessage
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during logout"
    };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      console.log("No authenticated user found");
      return null;
    }

    console.log("Getting user data for:", firebaseUser.uid);

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

    if (!userDoc.exists()) {
      console.warn("User document not found in Firestore for:", firebaseUser.uid);
      return null;
    }

    const userData = userDoc.data() as User;
    console.log("Current user data retrieved:", userData);
    return userData;
  } catch (error) {
    console.error("Get current user error:", error);

    // Handle Firestore errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error("Firestore error code:", error.code);
      const errorMessage = getAuthErrorMessage(error.code as string);
      console.error("Firestore error message:", errorMessage);
    }

    return null;
  }
}

// Auth state listener
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          callback(userData);
        } else {
          console.warn("User document not found in Firestore for:", firebaseUser.uid);
          callback(null);
        }
      } catch (error) {
        console.error("Error getting user data in auth state change:", error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}
