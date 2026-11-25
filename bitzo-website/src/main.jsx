import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App.jsx";
import React from "react";
import { Provider } from "react-redux";
import { store } from "./app/store";
import axios from "axios";
import { setupAxiosAuth } from "./utils/session";

setupAxiosAuth(axios);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
