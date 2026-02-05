import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleLineLoginCallback } from '../services/WiCare.LineLoginService';

export const LineAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // 從 URL 參數中獲取授權碼和狀態
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code) {
          const errorReason = searchParams.get('error');
          const errorDescription = searchParams.get('error_description');
          setError(`登陸失敗: ${errorDescription || errorReason || '未知錯誤'}`);
          setIsProcessing(false);
          return;
        }

        if (!state) {
          setError('缺少狀態驗證信息，無法登陸');
          setIsProcessing(false);
          return;
        }

        // 處理 LINE 登陸回調
        const result = await handleLineLoginCallback(code, state);

        if (result.success) {
          // 登陸成功，重定向到主頁或儀表板
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 500);
        } else {
          setError(result.error || '登陸失敗，請重試');
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('LINE 登陸回調處理錯誤:', err);
        setError(
          err instanceof Error ? err.message : '處理登陸時出現錯誤'
        );
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [location, navigate]);

  return (
    <div className="line-callback-container">
      <div className="line-callback-content">
        {isProcessing ? (
          <div className="processing">
            <div className="spinner"></div>
            <h2>正在處理登陸...</h2>
            <p>請稍候，我們正在驗證您的 LINE 帳戶</p>
          </div>
        ) : (
          <div className="error">
            <h2>登陸失敗</h2>
            <p>{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="retry-btn"
            >
              返回登陸頁面
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LineAuthCallbackPage;
