import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from '@pages/Home';
import { Login } from '@pages/Login';
import Profile from '@pages/Profile';
import NotFound from '@pages/NotFound';
import { Register } from "@pages/Register.tsx";
import ConfirmEmail from "@pages/ConfirmEmail.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/register" element={<Register />} />
                <Route path="/confirm-email" element={<ConfirmEmail />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
