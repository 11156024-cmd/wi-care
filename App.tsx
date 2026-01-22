import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { 
  Monitor,
  BookHeart,
  Users,
  Cpu,
  Settings,
  Bell,
  RotateCcw,
  LogIn,
  Menu,
  X
} from 'lucide-react';

// Pages
import MonitorPage from './pages/MonitorPage';
import HealthLogPage from './pages/HealthLogPage';
import CaregiversPage from './pages/CaregiversPage';
import DevicesPage from './pages/DevicesPage';
import SettingsPage from './pages/SettingsPage';

// Components
import LoginModal from './components/WiCare.LoginModal';

// Services
import { checkESP32Health } from './services/WiCare.ESP32Api';

// Header Component
const Header: React.FC<{
  esp32Connected: boolean;
  isLoggedIn: boolean;
  currentUser: string | null;
  onLoginClick: () => void;
  onLogout: () => void;
}> = ({ esp32Connected, isLoggedIn, currentUser, onLoginClick, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo">
          <div className="logo-icon">
            <span>W</span>
          </div>
          <div className="logo-text">
            <span className="logo-title">WI-CARE</span>
            <span className="logo-subtitle">智慧長照系統</span>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        {/* Main Navigation */}
        <nav className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Monitor className="nav-icon" />
            <span>即時監控</span>
          </NavLink>
          <NavLink to="/health" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <BookHeart className="nav-icon" />
            <span>健康日誌</span>
          </NavLink>
          <NavLink to="/caregivers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users className="nav-icon" />
            <span>護理人員</span>
          </NavLink>
          <NavLink to="/devices" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Cpu className="nav-icon" />
            <span>設備管理</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings className="nav-icon" />
            <span>系統設定</span>
          </NavLink>
        </nav>

        {/* Right Actions */}
        <div className="header-actions">
          {/* Connection Status */}
          <div className="connection-status">
            <span className={`status-dot ${esp32Connected ? 'online' : 'offline'}`}></span>
            <span className="status-text">{esp32Connected ? '已連線' : '離線'}</span>
          </div>
          
          <div className="header-divider"></div>
          
          {isLoggedIn ? (
            <div className="user-menu">
              <span className="user-name">{currentUser}</span>
              <button className="logout-btn" onClick={onLogout}>
                登出
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={onLoginClick}>
              <LogIn className="login-icon" />
              <span>登入</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

// Main App Component
const App: React.FC = () => {
  const [esp32Connected, setEsp32Connected] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // 初始化 ESP32 連線狀態
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await checkESP32Health();
        setEsp32Connected(connected);
      } catch {
        setEsp32Connected(false);
      }
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (username: string, name: string, role: string) => {
    setIsLoggedIn(true);
    setCurrentUser(name);
    setShowLogin(false);
    console.log(`[App] 使用者 ${name} (${username}) 已登入，角色: ${role}`);
  };

  const handleLogout = async () => {
    try {
      const { authApi } = await import('./services/WiCare.ApiService');
      await authApi.logout();
    } catch (error) {
      console.error('[App] 登出失敗:', error);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    console.log('[App] 使用者已登出');
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <Header 
          esp32Connected={esp32Connected}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLoginClick={() => setShowLogin(true)}
          onLogout={handleLogout}
        />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <MonitorPage 
                esp32Connected={esp32Connected} 
                setEsp32Connected={setEsp32Connected} 
              />
            } />
            <Route path="/health" element={<HealthLogPage />} />
            <Route path="/caregivers" element={<CaregiversPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <span>W</span>
              </div>
              <span className="footer-name">WI-CARE</span>
            </div>
            <p className="footer-copyright">
              © 2026 WI-CARE ELDERLY TECH. ALL RIGHTS RESERVED.
            </p>
          </div>
        </footer>

        {/* Login Modal */}
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;
