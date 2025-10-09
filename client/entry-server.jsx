import React from "react";
import { renderToString } from "react-dom/server";
import App from "./components/App.jsx";
// Make sure CSS is imported for SSR
import "./base.css";

export function render(url) {
  try {
    console.log("SSR rendering for URL:", url);
    const html = renderToString(<App />);
    console.log("SSR render successful, HTML length:", html.length);
    return { html };
  } catch (error) {
    console.error("SSR render error:", error);
    return { html: '<div>Error rendering page</div>' };
  }
}
