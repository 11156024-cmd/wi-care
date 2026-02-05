import React, { useState } from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  Battery, 
  Signal, 
  Settings,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MapPin,
  Clock,
  Activity,
  Zap
} from 'lucide-react';

// 模擬設備數據
const DEVICES = [
  {
    id: 'WC-ESP32-001',
    name: 'Wi-Care 主站 #1',
    type: 'ESP32 主控',
    location: '浴室',
    status: 'online',
    battery: 85,
    signal: 92,
    lastSeen: '剛剛',
    firmware: 'v2.1.0',
    ip: '192.168.0.101'
  },
  {
    id: 'WC-ESP32-002',
    name: 'Wi-Care 主站 #2',
    type: 'ESP32 主控',
    location: '臥室',
    status: 'online',
    battery: 72,
    signal: 88,
    lastSeen: '1分鐘前',
    firmware: 'v2.1.0',
    ip: '192.168.0.102'
  },
  {
    id: 'WC-SENSOR-001',
    name: '加速度計 #1',
    type: '動作感測器',
    location: '浴室',
    status: 'online',
    battery: 95,
    signal: 96,
    lastSeen: '剛剛',
    firmware: 'v1.5.2',
    ip: null
  },
  {
    id: 'WC-SENSOR-002',
    name: '加速度計 #2',
    type: '動作感測器',
    location: '臥室',
    status: 'warning',
    battery: 25,
    signal: 78,
    lastSeen: '5分鐘前',
    firmware: 'v1.5.2',
    ip: null
  },
  {
    id: 'WC-GATEWAY-001',
    name: '網關設備',
    type: '通訊閘道',
    location: '客廳',
    status: 'offline',
    battery: null,
    signal: 0,
    lastSeen: '2小時前',
    firmware: 'v3.0.1',
    ip: '192.168.0.1'
  }
];

const DevicesPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [devices, setDevices] = useState(DEVICES);
  const [currentDevice, setCurrentDevice] = useState<typeof DEVICES[0] | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'ESP32 主控',
    location: '浴室',
    ip: ''
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // 模擬刷新
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
    alert('設備狀態已更新！');
  };

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    const newDevice = {
      id: `WC-NEW-${Date.now().toString().slice(-6)}`,
      name: formData.name,
      type: formData.type,
      location: formData.location,
      status: 'offline' as const,
      battery: formData.type === '通訊閘道' ? null : 100,
      signal: 0,
      lastSeen: '剛加入',
      firmware: 'v1.0.0',
      ip: formData.ip || null
    };
    setDevices([...devices, newDevice]);
    setShowAddModal(false);
    setFormData({ name: '', type: 'ESP32 主控', location: '浴室', ip: '' });
    alert('已成功新增設備！');
  };

  const handleEditDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDevice) return;
    
    setDevices(devices.map(d => 
      d.id === currentDevice.id 
        ? { ...d, name: formData.name, type: formData.type, location: formData.location, ip: formData.ip || d.ip }
        : d
    ));
    setShowEditModal(false);
    setCurrentDevice(null);
    setFormData({ name: '', type: 'ESP32 主控', location: '浴室', ip: '' });
    alert('已成功更新設備資料！');
  };

  const handleDeleteDevice = () => {
    if (!currentDevice) return;
    
    setDevices(devices.filter(d => d.id !== currentDevice.id));
    setShowDeleteModal(false);
    setCurrentDevice(null);
    setSelectedDevice(null);
    alert('已成功移除設備！');
  };

  const openEditModal = (device: typeof DEVICES[0]) => {
    setCurrentDevice(device);
    setFormData({
      name: device.name,
      type: device.type,
      location: device.location,
      ip: device.ip || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (device: typeof DEVICES[0]) => {
    setCurrentDevice(device);
    setShowDeleteModal(true);
  };

  const openSettingsModal = (device: typeof DEVICES[0]) => {
    setCurrentDevice(device);
    setShowSettingsModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="device-status-icon online" size={18} />;
      case 'warning': return <AlertTriangle className="device-status-icon warning" size={18} />;
      case 'offline': return <XCircle className="device-status-icon offline" size={18} />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '正常運作';
      case 'warning': return '需要注意';
      case 'offline': return '離線';
      default: return '';
    }
  };

  const getBatteryColor = (level: number | null) => {
    if (level === null) return '#94a3b8';
    if (level > 50) return '#22c55e';
    if (level > 20) return '#f59e0b';
    return '#ef4444';
  };

  const getSignalColor = (level: number) => {
    if (level > 70) return '#22c55e';
    if (level > 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">
          <Cpu className="page-title-icon" />
          設備管理
        </h1>
        <div className="page-actions">
          <button 
            className={`btn btn-outline ${refreshing ? 'refreshing' : ''}`} 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
            {refreshing ? '刷新中...' : '刷新狀態'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            新增設備
          </button>
        </div>
      </div>

      {/* Device Stats */}
      <div className="device-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Cpu size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{devices.length}</span>
            <span className="stat-label">總設備數</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon online">
            <Wifi size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{devices.filter(d => d.status === 'online').length}</span>
            <span className="stat-label">在線設備</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{devices.filter(d => d.status === 'warning').length}</span>
            <span className="stat-label">需要注意</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon offline">
            <WifiOff size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{devices.filter(d => d.status === 'offline').length}</span>
            <span className="stat-label">離線設備</span>
          </div>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="devices-grid">
        {devices.map(device => (
          <div 
            key={device.id} 
            className={`device-card ${device.status} ${selectedDevice === device.id ? 'selected' : ''}`}
            onClick={() => setSelectedDevice(selectedDevice === device.id ? null : device.id)}
          >
            <div className="device-header">
              <div className="device-icon">
                {device.type === 'ESP32 主控' ? <Cpu size={24} /> : 
                 device.type === '動作感測器' ? <Activity size={24} /> :
                 <Zap size={24} />}
              </div>
              <div className="device-title">
                <h4>{device.name}</h4>
                <span className="device-type">{device.type}</span>
              </div>
              <div className={`device-status ${device.status}`}>
                {getStatusIcon(device.status)}
              </div>
            </div>

            <div className="device-info-grid">
              <div className="info-item">
                <MapPin size={14} />
                <span>{device.location}</span>
              </div>
              <div className="info-item">
                <Clock size={14} />
                <span>{device.lastSeen}</span>
              </div>
              {device.battery !== null && (
                <div className="info-item">
                  <Battery size={14} style={{ color: getBatteryColor(device.battery) }} />
                  <span style={{ color: getBatteryColor(device.battery) }}>{device.battery}%</span>
                </div>
              )}
              <div className="info-item">
                <Signal size={14} style={{ color: getSignalColor(device.signal) }} />
                <span style={{ color: getSignalColor(device.signal) }}>{device.signal}%</span>
              </div>
            </div>

            <div className="device-footer">
              <span className="device-id">{device.id}</span>
              <span className="device-firmware">{device.firmware}</span>
            </div>

            {selectedDevice === device.id && (
              <div className="device-actions">
                <button className="action-btn" onClick={() => openSettingsModal(device)}>
                  <Settings size={16} />
                  設定
                </button>
                <button className="action-btn" onClick={() => openEditModal(device)}>
                  <Edit size={16} />
                  編輯
                </button>
                <button className="action-btn danger" onClick={() => openDeleteModal(device)}>
                  <Trash2 size={16} />
                  移除
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <Plus size={24} />
              新增設備
            </h2>
            <form className="modal-form" onSubmit={handleAddDevice}>
              <div className="form-group">
                <label>設備名稱</label>
                <input 
                  type="text" 
                  placeholder="請輸入設備名稱" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>設備類型</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="ESP32 主控">ESP32 主控</option>
                  <option value="動作感測器">動作感測器</option>
                  <option value="通訊閘道">通訊閘道</option>
                </select>
              </div>
              <div className="form-group">
                <label>安裝位置</label>
                <select 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                >
                  <option value="浴室">浴室</option>
                  <option value="臥室">臥室</option>
                  <option value="客廳">客廳</option>
                  <option value="廚房">廚房</option>
                </select>
              </div>
              <div className="form-group">
                <label>IP 位址 (選填)</label>
                <input 
                  type="text" 
                  placeholder="例如: 192.168.0.100" 
                  value={formData.ip}
                  onChange={(e) => setFormData({...formData, ip: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <Edit size={24} />
              編輯設備
            </h2>
            <form className="modal-form" onSubmit={handleEditDevice}>
              <div className="form-group">
                <label>設備名稱</label>
                <input 
                  type="text" 
                  placeholder="請輸入設備名稱" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>設備類型</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="ESP32 主控">ESP32 主控</option>
                  <option value="動作感測器">動作感測器</option>
                  <option value="通訊閘道">通訊閘道</option>
                </select>
              </div>
              <div className="form-group">
                <label>安裝位置</label>
                <select 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                >
                  <option value="浴室">浴室</option>
                  <option value="臥室">臥室</option>
                  <option value="客廳">客廳</option>
                  <option value="廚房">廚房</option>
                </select>
              </div>
              <div className="form-group">
                <label>IP 位址</label>
                <input 
                  type="text" 
                  placeholder="例如: 192.168.0.100" 
                  value={formData.ip}
                  onChange={(e) => setFormData({...formData, ip: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <Trash2 size={24} />
              確認移除
            </h2>
            <p className="delete-message">
              確定要移除設備「{currentDevice?.name}」嗎？此操作無法復原。
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>
                取消
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteDevice}>
                確認移除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Settings Modal */}
      {showSettingsModal && currentDevice && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <Settings size={24} />
              設備設定 - {currentDevice.name}
            </h2>
            <div className="device-settings-info">
              <div className="info-row">
                <span className="label">設備 ID:</span>
                <span className="value">{currentDevice.id}</span>
              </div>
              <div className="info-row">
                <span className="label">類型:</span>
                <span className="value">{currentDevice.type}</span>
              </div>
              <div className="info-row">
                <span className="label">位置:</span>
                <span className="value">{currentDevice.location}</span>
              </div>
              <div className="info-row">
                <span className="label">韌體版本:</span>
                <span className="value">{currentDevice.firmware}</span>
              </div>
              <div className="info-row">
                <span className="label">IP 位址:</span>
                <span className="value">{currentDevice.ip || '無'}</span>
              </div>
              <div className="info-row">
                <span className="label">狀態:</span>
                <span className={`value status-${currentDevice.status}`}>
                  {getStatusText(currentDevice.status)}
                </span>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowSettingsModal(false)}>
                關閉
              </button>
              <button type="button" className="btn btn-primary" onClick={() => {
                alert('正在重啟設備...');
                setShowSettingsModal(false);
              }}>
                重啟設備
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesPage;
