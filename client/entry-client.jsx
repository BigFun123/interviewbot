import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "./components/App.jsx";
import "./base.css";

// Add error handling for hydration
try {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    const root = document.getElementById("root");
    if (root) {
      hydrateRoot(root, <App />);
    } else {
      console.error("Root element not found");
    }
  }
} catch (error) {
  console.error("Hydration error:", error);
  // Fallback to regular render if hydration fails
  if (typeof window !== 'undefined') {
    import('react-dom/client').then(({ createRoot }) => {
      const root = document.getElementById("root");
      if (root) {
        root.innerHTML = ""; // Clear any SSR content
        createRoot(root).render(<App />);
      }
    });
  }
}

// Clear any cached service workers or old registrations
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
}
