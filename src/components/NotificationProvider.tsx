import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { Notification, subscribeToNotifications, NotificationType } from '../utils/errorHandler';

// ========================================
// Context 定義
// ========================================

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// ========================================
// Provider 組件
// ========================================

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  maxNotifications = 5 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
      dismissible: notification.dismissible ?? true
    };

    setNotifications(prev => {
      const updated = [fullNotification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    // 自動移除
    if (fullNotification.duration && fullNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, fullNotification.duration);
    }
  }, [maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // 訂閱全域通知
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification) => {
      setNotifications(prev => {
        const updated = [notification, ...prev];
        return updated.slice(0, maxNotifications);
      });

      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
      }
    });

    return unsubscribe;
  }, [maxNotifications, removeNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

// ========================================
// Hook
// ========================================

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// ========================================
// 通知容器組件
// ========================================

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="notification-container" role="region" aria-label="通知">
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onRemove={onRemove} 
        />
      ))}
    </div>
  );
};

// ========================================
// 單一通知組件
// ========================================

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="notification-icon success" size={20} />;
      case 'warning':
        return <AlertTriangle className="notification-icon warning" size={20} />;
      case 'error':
        return <XCircle className="notification-icon error" size={20} />;
      case 'info':
      default:
        return <Info className="notification-icon info" size={20} />;
    }
  };

  return (
    <div 
      className={`notification-item notification-${notification.type}`}
      role="alert"
      aria-live="polite"
    >
      {getIcon(notification.type)}
      <div className="notification-content">
        <h4 className="notification-title">{notification.title}</h4>
        <p className="notification-message">{notification.message}</p>
      </div>
      {notification.dismissible && (
        <button 
          className="notification-close"
          onClick={() => onRemove(notification.id)}
          aria-label="關閉通知"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default NotificationProvider;
