import { defineStore } from "pinia";
import { ref } from "vue";

export const useThemeStore = defineStore("theme", () => {
  const isDark = ref(localStorage.getItem("theme") === "dark");

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
  };

  const setTheme = (dark) => {
    isDark.value = dark;
    localStorage.setItem("theme", dark ? "dark" : "light");
  };

  return {
    isDark,
    toggleTheme,
    setTheme,
  };
});
