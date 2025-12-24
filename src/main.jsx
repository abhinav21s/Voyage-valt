import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LogInContextProvider } from "./Context/LogInContext/Login.jsx";
import ErrorBoundary from "./components/constants/Error.jsx";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./Context/DarkMode/ThemeProvider.jsx";
import { RefProvider } from "./Context/RefContext/RefContext.jsx";
import { CacheProvider } from "./Context/Cache/CacheContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <CacheProvider>
          <RefProvider>
            <LogInContextProvider>
              <ErrorBoundary>
                <Toaster />
                <App />
              </ErrorBoundary>
            </LogInContextProvider>
          </RefProvider>
        </CacheProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);
