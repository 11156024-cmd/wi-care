import React, { useState } from 'react';
import { X, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { RegistrationData } from '../WiCare.Types';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: RegistrationData) => void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose, onRegister }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'elderly',
    emergencyContact: '',
    address: '',
    dateOfBirth: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '請輸入姓名';
    }
    if (!formData.email.trim()) {
      newErrors.email = '請輸入電子郵件';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = '請輸入電話號碼';
    } else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = '請輸入有效的電話號碼';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = '請輸入密碼';
    } else if (formData.password.length < 8) {
      newErrors.password = '密碼至少需要 8 個字元';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '請確認密碼';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '密碼不匹配';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = '請輸入出生日期';
    }
    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = '請輸入緊急聯絡人';
    }
    if (!formData.address.trim()) {
      newErrors.address = '請輸入地址';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(prev => (prev - 1) as 1 | 2 | 3);
      setErrors({});
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateStep3()) {
      const { confirmPassword, ...submitData } = formData;
      console.log('Submitting registration:', submitData);
      
      onRegister(formData);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'elderly',
      emergencyContact: '',
      address: '',
      dateOfBirth: '',
    });
    setErrors({});
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">建立帳戶</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">步驟 {step} / 3</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success && (
          <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <span className="text-sm font-medium text-green-700">註冊成功！</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="請輸入您的姓名"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                    errors.name
                      ? 'border-red-200 focus:ring-red-300 bg-red-50'
                      : 'border-slate-200 focus:ring-indigo-300 bg-white'
                  }`}
                />
                {errors.name && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  電子郵件 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                    errors.email
                      ? 'border-red-200 focus:ring-red-300 bg-red-50'
                      : 'border-slate-200 focus:ring-indigo-300 bg-white'
                  }`}
                />
                {errors.email && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  電話號碼 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0912-345-678"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                    errors.phone
                      ? 'border-red-200 focus:ring-red-300 bg-red-50'
                      : 'border-slate-200 focus:ring-indigo-300 bg-white'
                  }`}
                />
                {errors.phone && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  身份角色 <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-white"
                >
                  <option value="elderly">長輩</option>
                  <option value="caregiver">照顧者</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  密碼 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="至少 8 個字元"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 pr-10 ${
                      errors.password
                        ? 'border-red-200 focus:ring-red-300 bg-red-50'
                        : 'border-slate-200 focus:ring-indigo-300 bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  確認密碼 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="再次輸入密碼"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 pr-10 ${
                      errors.confirmPassword
                        ? 'border-red-200 focus:ring-red-300 bg-red-50'
                        : 'border-slate-200 focus:ring-indigo-300 bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">密碼要求</span>
                  <br />
                  • 至少 8 個字元
                  <br />
                  • 建議包含大小寫字母和數字
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  出生日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                    errors.dateOfBirth
                      ? 'border-red-200 focus:ring-red-300 bg-red-50'
                      : 'border-slate-200 focus:ring-indigo-300 bg-white'
                  }`}
                />
                {errors.dateOfBirth && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.dateOfBirth}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  緊急聯絡人 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder="例如：張三 (0912-345-678)"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                    errors.emergencyContact
                      ? 'border-red-200 focus:ring-red-300 bg-red-50'
                      : 'border-slate-200 focus:ring-indigo-300 bg-white'
                  }`}
                />
                {errors.emergencyContact && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.emergencyContact}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  住址 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="請輸入您的住址"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                    errors.address
                      ? 'border-red-200 focus:ring-red-300 bg-red-50'
                      : 'border-slate-200 focus:ring-indigo-300 bg-white'
                  }`}
                />
                {errors.address && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.address}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            {[1, 2, 3].map(stepNum => (
              <div
                key={stepNum}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  stepNum <= step ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                返回
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                下一步
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
              >
                完成註冊
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationModal;
