import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DirectMessage from "./pages/DirectMessage";
import MessengerPage from "./pages/MessengerPage";
import ContactsPage from "./pages/ContactsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/direct-message/:friendId" element={<DirectMessage />} />
        <Route path="/customer" element={<MessengerPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
