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

  const signIn = async (email, password) => {
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

      console.log("Profile response:", { profile, profileError });

      if (profileError) throw profileError;

      user.value = {
        ...data.user,
        role: profile.role,
      };

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
          user.value = {
            ...session.user,
            role: profile.role,
          };
        }
      }
    } catch (err) {
      console.error("Error checking user:", err);
    }
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
  };
});
