import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Shield,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

// 模擬護理人員數據
const CAREGIVERS = [
  {
    id: 1,
    name: '王小明',
    role: '護理師',
    email: 'wang.xiaoming@wicare.com',
    phone: '0912-345-678',
    status: 'online',
    shift: '早班',
    assignedElders: 5,
    avatar: null,
    lastActive: '剛剛'
  },
  {
    id: 2,
    name: '李美玲',
    role: '照護員',
    email: 'li.meiling@wicare.com',
    phone: '0923-456-789',
    status: 'online',
    shift: '早班',
    assignedElders: 3,
    avatar: null,
    lastActive: '5分鐘前'
  },
  {
    id: 3,
    name: '陳大偉',
    role: '護理師',
    email: 'chen.dawei@wicare.com',
    phone: '0934-567-890',
    status: 'busy',
    shift: '中班',
    assignedElders: 4,
    avatar: null,
    lastActive: '10分鐘前'
  },
  {
    id: 4,
    name: '張雅婷',
    role: '照護員',
    email: 'zhang.yating@wicare.com',
    phone: '0945-678-901',
    status: 'offline',
    shift: '晚班',
    assignedElders: 6,
    avatar: null,
    lastActive: '2小時前'
  },
  {
    id: 5,
    name: '林志豪',
    role: '護理長',
    email: 'lin.zhihao@wicare.com',
    phone: '0956-789-012',
    status: 'online',
    shift: '早班',
    assignedElders: 0,
    avatar: null,
    lastActive: '剛剛'
  }
];

const SHIFTS = [
  { name: '早班', time: '07:00 - 15:00', color: '#22c55e' },
  { name: '中班', time: '15:00 - 23:00', color: '#f59e0b' },
  { name: '晚班', time: '23:00 - 07:00', color: '#8b5cf6' }
];

const CaregiversPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [caregivers, setCaregivers] = useState(CAREGIVERS);
  const [selectedCaregiver, setSelectedCaregiver] = useState<typeof CAREGIVERS[0] | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '護理師',
    email: '',
    phone: '',
    shift: '早班'
  });

  const filteredCaregivers = caregivers.filter(caregiver => {
    const matchesSearch = caregiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caregiver.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'online' && caregiver.status !== 'offline') ||
                         (selectedFilter === 'offline' && caregiver.status === 'offline');
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="status-icon online" size={16} />;
      case 'busy': return <Clock className="status-icon busy" size={16} />;
      case 'offline': return <AlertCircle className="status-icon offline" size={16} />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '在線';
      case 'busy': return '忙碌';
      case 'offline': return '離線';
      default: return '';
    }
  };

  const handleAddCaregiver = (e: React.FormEvent) => {
    e.preventDefault();
    const newCaregiver = {
      id: Date.now(),
      name: formData.name,
      role: formData.role,
      email: formData.email,
      phone: formData.phone,
      status: 'offline' as const,
      shift: formData.shift,
      assignedElders: 0,
      avatar: null,
      lastActive: '剛加入'
    };
    setCaregivers([...caregivers, newCaregiver]);
    setShowAddModal(false);
    setFormData({ name: '', role: '護理師', email: '', phone: '', shift: '早班' });
    alert('已成功新增護理人員！');
  };

  const handleEditCaregiver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaregiver) return;
    
    setCaregivers(caregivers.map(c => 
      c.id === selectedCaregiver.id 
        ? { ...c, name: formData.name, role: formData.role, email: formData.email, phone: formData.phone, shift: formData.shift }
        : c
    ));
    setShowEditModal(false);
    setSelectedCaregiver(null);
    setFormData({ name: '', role: '護理師', email: '', phone: '', shift: '早班' });
    alert('已成功更新護理人員資料！');
  };

  const handleDeleteCaregiver = () => {
    if (!selectedCaregiver) return;
    
    setCaregivers(caregivers.filter(c => c.id !== selectedCaregiver.id));
    setShowDeleteModal(false);
    setSelectedCaregiver(null);
    alert('已成功刪除護理人員！');
  };

  const openEditModal = (caregiver: typeof CAREGIVERS[0]) => {
    setSelectedCaregiver(caregiver);
    setFormData({
      name: caregiver.name,
      role: caregiver.role,
      email: caregiver.email,
      phone: caregiver.phone,
      shift: caregiver.shift
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (caregiver: typeof CAREGIVERS[0]) => {
    setSelectedCaregiver(caregiver);
    setShowDeleteModal(true);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">
          <Users className="page-title-icon" />
          護理人員管理
        </h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} />
          新增人員
        </button>
      </div>

      {/* Stats Overview */}
      <div className="caregiver-stats">
        <div className="stat-card">
          <div className="stat-number">{caregivers.length}</div>
          <div className="stat-label">總人數</div>
        </div>
        <div className="stat-card online">
          <div className="stat-number">{caregivers.filter(c => c.status === 'online').length}</div>
          <div className="stat-label">在線</div>
        </div>
        <div className="stat-card busy">
          <div className="stat-number">{caregivers.filter(c => c.status === 'busy').length}</div>
          <div className="stat-label">忙碌</div>
        </div>
        <div className="stat-card offline">
          <div className="stat-number">{caregivers.filter(c => c.status === 'offline').length}</div>
          <div className="stat-label">離線</div>
        </div>
      </div>

      {/* Shift Schedule */}
      <div className="shift-schedule">
        <h3 className="section-title">
          <Calendar size={20} />
          今日班表
        </h3>
        <div className="shift-grid">
          {SHIFTS.map(shift => (
            <div key={shift.name} className="shift-card" style={{ borderLeftColor: shift.color }}>
              <div className="shift-name">{shift.name}</div>
              <div className="shift-time">{shift.time}</div>
              <div className="shift-count">
                {caregivers.filter(c => c.shift === shift.name).length} 人
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="搜尋人員..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            全部
          </button>
          <button 
            className={`filter-tab ${selectedFilter === 'online' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('online')}
          >
            在線
          </button>
          <button 
            className={`filter-tab ${selectedFilter === 'offline' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('offline')}
          >
            離線
          </button>
        </div>
      </div>

      {/* Caregivers List */}
      <div className="caregivers-grid">
        {filteredCaregivers.map(caregiver => (
          <div key={caregiver.id} className="caregiver-card">
            <div className="caregiver-header">
              <div className="caregiver-avatar">
                {caregiver.name.charAt(0)}
              </div>
              <div className="caregiver-info">
                <h4 className="caregiver-name">{caregiver.name}</h4>
                <span className="caregiver-role">{caregiver.role}</span>
              </div>
              <div className={`caregiver-status ${caregiver.status}`}>
                {getStatusIcon(caregiver.status)}
                <span>{getStatusText(caregiver.status)}</span>
              </div>
            </div>
            
            <div className="caregiver-details">
              <div className="detail-item">
                <Mail size={14} />
                <span>{caregiver.email}</span>
              </div>
              <div className="detail-item">
                <Phone size={14} />
                <span>{caregiver.phone}</span>
              </div>
              <div className="detail-item">
                <Shield size={14} />
                <span>負責 {caregiver.assignedElders} 位長者</span>
              </div>
              <div className="detail-item">
                <Clock size={14} />
                <span>最後活動: {caregiver.lastActive}</span>
              </div>
            </div>

            <div className="caregiver-actions">
              <button className="action-btn edit" onClick={() => openEditModal(caregiver)}>
                <Edit size={16} />
                編輯
              </button>
              <button className="action-btn delete" onClick={() => openDeleteModal(caregiver)}>
                <Trash2 size={16} />
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <UserPlus size={24} />
              新增護理人員
            </h2>
            <form className="modal-form" onSubmit={handleAddCaregiver}>
              <div className="form-group">
                <label>姓名</label>
                <input 
                  type="text" 
                  placeholder="請輸入姓名" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>角色</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="護理師">護理師</option>
                  <option value="照護員">照護員</option>
                  <option value="護理長">護理長</option>
                </select>
              </div>
              <div className="form-group">
                <label>電子郵件</label>
                <input 
                  type="email" 
                  placeholder="請輸入電子郵件" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>電話</label>
                <input 
                  type="tel" 
                  placeholder="請輸入電話號碼" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>班別</label>
                <select 
                  value={formData.shift}
                  onChange={(e) => setFormData({...formData, shift: e.target.value})}
                >
                  <option value="早班">早班</option>
                  <option value="中班">中班</option>
                  <option value="晚班">晚班</option>
                </select>
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              <Edit size={24} />
              編輯護理人員
            </h2>
            <form className="modal-form" onSubmit={handleEditCaregiver}>
              <div className="form-group">
                <label>姓名</label>
                <input 
                  type="text" 
                  placeholder="請輸入姓名" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>角色</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="護理師">護理師</option>
                  <option value="照護員">照護員</option>
                  <option value="護理長">護理長</option>
                </select>
              </div>
              <div className="form-group">
                <label>電子郵件</label>
                <input 
                  type="email" 
                  placeholder="請輸入電子郵件" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>電話</label>
                <input 
                  type="tel" 
                  placeholder="請輸入電話號碼" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>班別</label>
                <select 
                  value={formData.shift}
                  onChange={(e) => setFormData({...formData, shift: e.target.value})}
                >
                  <option value="早班">早班</option>
                  <option value="中班">中班</option>
                  <option value="晚班">晚班</option>
                </select>
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
              確認刪除
            </h2>
            <p className="delete-message">
              確定要刪除護理人員「{selectedCaregiver?.name}」嗎？此操作無法復原。
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>
                取消
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteCaregiver}>
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaregiversPage;
