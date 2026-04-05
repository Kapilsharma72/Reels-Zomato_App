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
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import AdminDashboard from '../pages/AdminDashboard';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../general/home';
import FoodPartnerProfile from '../general/foodPartnerProfile';
import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<UnifiedLogin />} />
                <Route path="/register" element={<UnifiedRegister />} />
                <Route path="/user/register" element={<UnifiedRegister />} />
                <Route path="/user/login" element={<UnifiedLogin />} />
                <Route path="/food-partner/register" element={<UnifiedRegister />} />
                <Route path="/food-partner/login" element={<FoodPartnerLogin />} />
                <Route path="/delivery/register" element={<DeliveryPartnerRegister />} />
                <Route path="/editor/register" element={<EditorRegister />} />
                <Route path="/food-partner/:id" element={<FoodPartnerProfile />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Protected routes */}
                <Route path="/user/home" element={
                    <ProtectedRoute requiredRole="user"><UserHome /></ProtectedRoute>
                } />
                <Route path="/reels" element={
                    <ProtectedRoute requiredRole="user"><Home /></ProtectedRoute>
                } />
                <Route path="/food-partner/dashboard" element={
                    <ProtectedRoute requiredRole="food-partner"><FoodPartnerDashboard /></ProtectedRoute>
                } />
                <Route path="/delivery/dashboard" element={
                    <ProtectedRoute requiredRole="delivery-partner"><DeliveryDashboard /></ProtectedRoute>
                } />
                <Route path="/editor/dashboard" element={
                    <ProtectedRoute requiredRole="editor"><EditorDashboard /></ProtectedRoute>
                } />
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;
