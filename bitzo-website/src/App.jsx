import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { RewardProvider } from "./context/RewardContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";

function AppContent() {
  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-center"
        gutter={10}
        containerStyle={{ top: "4.5rem", zIndex: 9999 }}
        toastOptions={{ duration: 4000 }}
      />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <RewardProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </RewardProvider>
    </ThemeProvider>
  );
}

export default App;
