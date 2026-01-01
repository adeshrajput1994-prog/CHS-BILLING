import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import "./lib/firebase.ts"; // Import Firebase initialization

createRoot(document.getElementById("root")!).render(<App />);