import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { RewardProvider } from "./context/RewardContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ToastContainer } from "react-toastify";

function AppContent() {
  const { theme } = useTheme();

  return (
    <>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
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
