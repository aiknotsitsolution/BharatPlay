import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { RewardProvider } from "./context/RewardContext";

function App() {
  return (
    <RewardProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </RewardProvider>
  );
}


export default App;
