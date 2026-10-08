import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "light" ? "dark" : "light"
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${
          theme === "light" ? "dark" : "light"
        } mode`}
        style={{
          position: "fixed",
          right: "20px",
          bottom: "20px",
          zIndex: 9999,
          padding: "10px 16px",
          border: "1px solid var(--border-color)",
          borderRadius: "10px",
          background: "var(--card-bg)",
          color: "var(--text-color)",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
      </button>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}