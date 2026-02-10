import React, { useState } from 'react';
import { X, LogIn, User, Lock, Eye, EyeOff, Shield, UserPlus, Phone, Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../services/ApiService';
import { openLineLoginWindow } from '../services/LineLoginService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, name: string, role: string) => void;
}

type ModalMode = 'login' | 'register';

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [mode, setMode] = useState<ModalMode>('login');
  
  // 登入表單
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // 註冊表單額外欄位
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('nurse');
  
  // 共用狀態
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhone('');
    setEmail('');
    setRole('nurse');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode: ModalMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('請輸入帳號和密碼');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authApi.login(username, password);
      
      if (response.success && response.data) {
        const { user } = response.data;
        onLogin(user.username, user.name, user.role);
        onClose();
        resetForm();
      } else {
        setError(response.message || '登入失敗');
      }
    } catch (err: any) {
      console.error('登入錯誤:', err);
      setError(err.message || '無法連接伺服器，請確認後端服務是否啟動');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 驗證
    if (!username.trim() || !password.trim() || !name.trim()) {
      setError('請填寫所有必填欄位');
      return;
    }
    
    if (username.length < 4) {
      setError('帳號至少需要 4 個字元');
      return;
    }
    
    if (password.length < 6) {
      setError('密碼至少需要 6 個字元');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authApi.register({
        username,
        password,
        name,
        role,
        phone,
        email,
      });
      
      if (response.success && response.data) {
        const { user } = response.data;
        setSuccess('註冊成功！正在登入...');
        setTimeout(() => {
          onLogin(user.username, user.name, user.role);
          onClose();
          resetForm();
        }, 1000);
      } else {
        setError(response.message || '註冊失敗');
      }
    } catch (err: any) {
      console.error('註冊錯誤:', err);
      setError(err.message || '無法連接伺服器');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`login-modal ${mode === 'register' ? 'register-mode' : ''}`}>
        {/* Header */}
        <div className="login-header">
          {mode === 'register' && (
            <button className="back-btn" onClick={() => switchMode('login')}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="login-logo">
            {mode === 'login' ? (
              <Shield className="login-logo-icon" />
            ) : (
              <UserPlus className="login-logo-icon" />
            )}
          </div>
          <h2 className="login-title">
            {mode === 'login' ? '歡迎回來' : '建立新帳號'}
          </h2>
          <p className="login-subtitle">
            {mode === 'login' 
              ? '登入 Wi-Care 智慧長照系統' 
              : '加入 Wi-Care 照護團隊'}
          </p>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <form className="login-form" onSubmit={handleLogin}>
            {error && <div className="login-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                帳號
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="請輸入帳號"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={16} />
                密碼
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>記住我</span>
              </label>
              <button type="button" className="forgot-password">
                忘記密碼？
              </button>
            </div>

            <button type="submit" className="login-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <LogIn size={18} />
                  登入系統
                </>
              )}
            </button>

            {/* 分隔線 */}
            <div className="divider">
              <span>或</span>
            </div>

            {/* LINE 登陸按鈕 */}
            <button 
              type="button" 
              className="line-login-btn"
              onClick={openLineLoginWindow}
              disabled={isLoading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 4.3 0 9.8c0 3.3 2.2 6.1 5.4 7.6.2.1.5.3.5.5v2.2c0 .7.7 1.1 1.3.8l2.2-1.3c.4.1.8.1 1.2.1 6.6 0 12-4.3 12-9.8S18.6 0 12 0z" />
              </svg>
              用 LINE 登入
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form className="login-form register-form" onSubmit={handleRegister}>
            {error && <div className="login-error">{error}</div>}
            {success && <div className="login-success">{success}</div>}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <User size={16} />
                  帳號 *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="至少 4 個字元"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <User size={16} />
                  姓名 *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="請輸入真實姓名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <Lock size={16} />
                  密碼 *
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="至少 6 個字元"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={16} />
                  確認密碼 *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="再次輸入密碼"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                角色
              </label>
              <select 
                className="form-input form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="nurse">護理師</option>
                <option value="caregiver">照護員</option>
                <option value="family">家屬</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <Phone size={16} />
                  電話
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="選填"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={16} />
                  Email
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="選填"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn register-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <UserPlus size={18} />
                  建立帳號
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="login-footer">
          {mode === 'login' ? (
            <p>還沒有帳號？ <button type="button" className="register-link" onClick={() => switchMode('register')}>立即註冊</button></p>
          ) : (
            <p>已有帳號？ <button type="button" className="register-link" onClick={() => switchMode('login')}>返回登入</button></p>
          )}
        </div>

        {/* Demo hint */}
        {mode === 'login' && (
          <div className="demo-hint">
            <p>🔐 測試帳號: admin / admin123 或 nurse1 / nurse123</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
