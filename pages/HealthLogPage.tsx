import React, { useState } from 'react';
import { 
  BookHeart, 
  Calendar, 
  Heart, 
  Activity, 
  Thermometer,
  Droplets,
  Moon,
  TrendingUp,
  FileText,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// 模擬健康數據
const HEALTH_DATA = {
  bloodPressure: [
    { date: '01/10', systolic: 125, diastolic: 82 },
    { date: '01/11', systolic: 128, diastolic: 85 },
    { date: '01/12', systolic: 122, diastolic: 80 },
    { date: '01/13', systolic: 130, diastolic: 88 },
    { date: '01/14', systolic: 126, diastolic: 84 },
    { date: '01/15', systolic: 124, diastolic: 81 },
    { date: '01/16', systolic: 127, diastolic: 83 },
  ],
  heartRate: [
    { date: '01/10', value: 72 },
    { date: '01/11', value: 75 },
    { date: '01/12', value: 70 },
    { date: '01/13', value: 78 },
    { date: '01/14', value: 74 },
    { date: '01/15', value: 71 },
    { date: '01/16', value: 73 },
  ],
  sleep: [
    { date: '01/10', hours: 7.5, quality: 85 },
    { date: '01/11', hours: 6.8, quality: 72 },
    { date: '01/12', hours: 8.0, quality: 90 },
    { date: '01/13', hours: 7.2, quality: 80 },
    { date: '01/14', hours: 6.5, quality: 68 },
    { date: '01/15', hours: 7.8, quality: 88 },
    { date: '01/16', hours: 7.0, quality: 82 },
  ],
  activity: [
    { date: '01/10', steps: 5200, calories: 180 },
    { date: '01/11', steps: 6800, calories: 220 },
    { date: '01/12', steps: 4500, calories: 150 },
    { date: '01/13', steps: 7200, calories: 245 },
    { date: '01/14', steps: 5800, calories: 195 },
    { date: '01/15', steps: 6100, calories: 210 },
    { date: '01/16', steps: 5500, calories: 185 },
  ]
};

const HEALTH_RECORDS = [
  { id: 1, date: '2026-01-16', type: '日常記錄', summary: '血壓正常，心率穩定', status: 'normal' },
  { id: 2, date: '2026-01-15', type: '用藥提醒', summary: '已服用降壓藥', status: 'completed' },
  { id: 3, date: '2026-01-14', type: '健康警示', summary: '血壓略高，建議休息', status: 'warning' },
  { id: 4, date: '2026-01-13', type: '日常記錄', summary: '睡眠品質良好', status: 'normal' },
  { id: 5, date: '2026-01-12', type: '醫療預約', summary: '已完成月度健康檢查', status: 'completed' },
];

const HealthLogPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'bloodPressure' | 'heartRate' | 'sleep' | 'activity'>('overview');
  const [dateRange, setDateRange] = useState('week');

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">
          <BookHeart className="page-title-icon" />
          健康日誌
        </h1>
        <div className="page-actions">
          <button className="btn btn-outline">
            <Filter size={18} />
            篩選
          </button>
          <button className="btn btn-primary">
            <Download size={18} />
            匯出報告
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="date-range-selector">
        <button className="date-nav-btn">
          <ChevronLeft size={20} />
        </button>
        <div className="date-range-tabs">
          <button 
            className={`range-tab ${dateRange === 'week' ? 'active' : ''}`}
            onClick={() => setDateRange('week')}
          >
            本週
          </button>
          <button 
            className={`range-tab ${dateRange === 'month' ? 'active' : ''}`}
            onClick={() => setDateRange('month')}
          >
            本月
          </button>
          <button 
            className={`range-tab ${dateRange === 'year' ? 'active' : ''}`}
            onClick={() => setDateRange('year')}
          >
            本年
          </button>
        </div>
        <button className="date-nav-btn">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Health Metrics Tabs */}
      <div className="health-tabs">
        <button 
          className={`health-tab ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          <Activity size={18} />
          總覽
        </button>
        <button 
          className={`health-tab ${selectedTab === 'bloodPressure' ? 'active' : ''}`}
          onClick={() => setSelectedTab('bloodPressure')}
        >
          <Droplets size={18} />
          血壓
        </button>
        <button 
          className={`health-tab ${selectedTab === 'heartRate' ? 'active' : ''}`}
          onClick={() => setSelectedTab('heartRate')}
        >
          <Heart size={18} />
          心率
        </button>
        <button 
          className={`health-tab ${selectedTab === 'sleep' ? 'active' : ''}`}
          onClick={() => setSelectedTab('sleep')}
        >
          <Moon size={18} />
          睡眠
        </button>
        <button 
          className={`health-tab ${selectedTab === 'activity' ? 'active' : ''}`}
          onClick={() => setSelectedTab('activity')}
        >
          <TrendingUp size={18} />
          活動
        </button>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="health-overview">
          {/* Quick Stats */}
          <div className="health-stats-grid">
            <div className="health-stat-card">
              <div className="stat-icon blood-pressure">
                <Droplets size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">血壓</span>
                <span className="stat-value">127/83</span>
                <span className="stat-unit">mmHg</span>
              </div>
            </div>
            <div className="health-stat-card">
              <div className="stat-icon heart-rate">
                <Heart size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">心率</span>
                <span className="stat-value">73</span>
                <span className="stat-unit">bpm</span>
              </div>
            </div>
            <div className="health-stat-card">
              <div className="stat-icon sleep">
                <Moon size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">睡眠</span>
                <span className="stat-value">7.0</span>
                <span className="stat-unit">小時</span>
              </div>
            </div>
            <div className="health-stat-card">
              <div className="stat-icon activity">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">步數</span>
                <span className="stat-value">5,500</span>
                <span className="stat-unit">步</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">血壓趨勢</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={HEALTH_DATA.bloodPressure}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[60, 150]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3 className="chart-title">心率趨勢</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={HEALTH_DATA.heartRate}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[60, 90]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#ec4899" fill="#fce7f3" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Records */}
          <div className="records-section">
            <h3 className="section-title">
              <FileText size={20} />
              近期記錄
            </h3>
            <div className="records-list">
              {HEALTH_RECORDS.map(record => (
                <div key={record.id} className={`record-item ${record.status}`}>
                  <div className="record-date">
                    <Calendar size={16} />
                    {record.date}
                  </div>
                  <div className="record-content">
                    <span className="record-type">{record.type}</span>
                    <span className="record-summary">{record.summary}</span>
                  </div>
                  <div className={`record-status ${record.status}`}>
                    {record.status === 'normal' && '正常'}
                    {record.status === 'completed' && '已完成'}
                    {record.status === 'warning' && '注意'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Blood Pressure Tab */}
      {selectedTab === 'bloodPressure' && (
        <div className="health-detail">
          <div className="detail-chart-card">
            <h3 className="chart-title">血壓記錄</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={HEALTH_DATA.bloodPressure}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[60, 150]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} name="收縮壓" dot={{ r: 5 }} />
                <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} name="舒張壓" dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-color" style={{background: '#ef4444'}}></span> 收縮壓</span>
              <span className="legend-item"><span className="legend-color" style={{background: '#3b82f6'}}></span> 舒張壓</span>
            </div>
          </div>
        </div>
      )}

      {/* Heart Rate Tab */}
      {selectedTab === 'heartRate' && (
        <div className="health-detail">
          <div className="detail-chart-card">
            <h3 className="chart-title">心率記錄</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={HEALTH_DATA.heartRate}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[60, 90]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#ec4899" fill="#fce7f3" strokeWidth={2} name="心率" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sleep Tab */}
      {selectedTab === 'sleep' && (
        <div className="health-detail">
          <div className="detail-chart-card">
            <h3 className="chart-title">睡眠記錄</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={HEALTH_DATA.sleep}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} name="睡眠時間" dot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="quality" stroke="#22c55e" strokeWidth={2} name="睡眠品質" dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-color" style={{background: '#8b5cf6'}}></span> 睡眠時間 (小時)</span>
              <span className="legend-item"><span className="legend-color" style={{background: '#22c55e'}}></span> 睡眠品質 (%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {selectedTab === 'activity' && (
        <div className="health-detail">
          <div className="detail-chart-card">
            <h3 className="chart-title">活動記錄</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={HEALTH_DATA.activity}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" domain={[0, 10000]} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 300]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="steps" stroke="#f59e0b" strokeWidth={2} name="步數" dot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="calories" stroke="#ef4444" strokeWidth={2} name="卡路里" dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-color" style={{background: '#f59e0b'}}></span> 步數</span>
              <span className="legend-item"><span className="legend-color" style={{background: '#ef4444'}}></span> 卡路里 (kcal)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthLogPage;
