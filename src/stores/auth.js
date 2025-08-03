import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/utils/supabase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === "admin");
  const isEmployee = computed(() => user.value?.role === "employee");

  // Save user to localStorage for persistence
  const saveUserToStorage = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('lastLoginTime', Date.now().toString());
  };

  // Load user from localStorage
  const loadUserFromStorage = () => {
    try {
      const savedUser = localStorage.getItem('user');
      const lastLoginTime = localStorage.getItem('lastLoginTime');
      
      if (savedUser && lastLoginTime) {
        const timeDiff = Date.now() - parseInt(lastLoginTime);
        const oneWeek = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
        
        // If less than 1 week, restore user
        if (timeDiff < oneWeek) {
          user.value = JSON.parse(savedUser);
          return true;
        } else {
          // Clear expired session
          clearUserFromStorage();
        }
      }
    } catch (err) {
      console.error("Error loading user from storage:", err);
      clearUserFromStorage();
    }
    return false;
  };

  // Clear user from localStorage
  const clearUserFromStorage = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('lastLoginTime');
  };

  const signIn = async (email, password, rememberMe = true) => {
    try {
      loading.value = true;
      error.value = null;

      console.log("Attempting sign in with:", { email });

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      console.log("Auth response:", { data, authError });

      if (authError) throw authError;

      console.log(
        "Auth successful, fetching profile for user ID:",
        data.user.id
      );

      // Get user profile data
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      console.log("Profile fetch result:", { profile, profileError });

      if (profileError) throw profileError;

      const userData = {
        ...data.user,
        role: profile.role,
      };

      user.value = userData;

      // Save to localStorage if rememberMe is true
      if (rememberMe) {
        saveUserToStorage(userData);
      }

      console.log("User set:", user.value);

      return { success: true };
    } catch (err) {
      console.error("Sign in error:", err);
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const signUp = async (email, password, role = "employee") => {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Create user profile
      const { error: profileError } = await supabase.from("users").insert([
        {
          id: data.user.id,
          email,
          role,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) throw profileError;

      return { success: true };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const signOut = async () => {
    try {
      loading.value = true;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      user.value = null;
      clearUserFromStorage(); // Clear localStorage
      return { success: true };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const checkUser = async () => {
    try {
      // First try to load from localStorage
      if (loadUserFromStorage()) {
        console.log("User loaded from localStorage:", user.value);
        return;
      }

      // If not in localStorage, check Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          const userData = {
            ...session.user,
            role: profile.role,
          };
          user.value = userData;
          saveUserToStorage(userData); // Save to localStorage
        }
      }
    } catch (err) {
      console.error("Error checking user:", err);
      clearUserFromStorage();
    }
  };

  // Initialize user on store creation
  const initAuth = () => {
    loadUserFromStorage();
  };

  return {
    user,
    loading,
    error,
    isLoggedIn,
    isAdmin,
    isEmployee,
    signIn,
    signUp,
    signOut,
    checkUser,
    initAuth,
    clearUserFromStorage,
  };
});
