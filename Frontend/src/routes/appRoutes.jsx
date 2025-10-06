// Removed imports for non-existent files: UserRegister, UserLogin, FoodPartnerRegister
import FoodPartnerLogin from '../pages/FoodPartnerLogin';
import LandingPage from '../pages/LandingPage';
import UnifiedLogin from '../pages/UnifiedLogin';
import UnifiedRegister from '../pages/UnifiedRegister';
import DeliveryPartnerRegister from '../pages/DeliveryPartnerRegister';
import EditorRegister from '../pages/EditorRegister';
import UserHome from '../pages/UserHome';
import FoodPartnerDashboard from '../pages/FoodPartnerDashboard';
import DeliveryDashboard from '../pages/DeliveryDashboard';
import EditorDashboard from '../pages/EditorDashboard';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../general/home';
import FoodPartnerProfile from '../general/foodPartnerProfile';

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<UnifiedLogin />} />
                <Route path="/register" element={<UnifiedRegister />} />
                <Route path="/user/register" element={<UnifiedRegister />} />
                <Route path="/user/login" element={<UnifiedLogin />} />
                <Route path="/food-partner/register" element={<UnifiedRegister />} />
                <Route path="/food-partner/login" element={<FoodPartnerLogin />} />
                <Route path="/delivery/register" element={<DeliveryPartnerRegister />} />
                <Route path="/editor/register" element={<EditorRegister />} />
                <Route path="/user/home" element={<UserHome />} />
                <Route path="/reels" element={<Home />} />
                <Route path="/food-partner/:id" element={<FoodPartnerProfile />} />
                <Route path="/food-partner/dashboard" element={<FoodPartnerDashboard />} />
                <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
                <Route path="/editor/dashboard" element={<EditorDashboard />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;