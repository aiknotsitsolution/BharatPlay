import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "react-toastify/dist/ReactToastify.css";
import React from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
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
