import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import "./index.css";
// Initialize i18n before rendering the app
import "./i18n";
// Initialize Catppuccin theme before rendering so there's no flash
import { useThemeStore } from "./stores/themeStore";

// Apply theme synchronously before React renders to prevent flash of wrong theme
useThemeStore.getState().init();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="bottom-right" richColors />
    </BrowserRouter>
  </React.StrictMode>
);
