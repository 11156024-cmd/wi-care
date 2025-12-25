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
    // Clear error for this field when user starts typing
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
      newErrors.name = 'Ë´ãËº∏?•Â???;
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Ë´ãËº∏?•ÈõªÂ≠êÈÉµ‰ª?;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ë´ãËº∏?•Ê??àÁ??ªÂ??µ‰ª∂';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Ë´ãËº∏?•ÈõªË©±Ë?Á¢?;
    } else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Ë´ãËº∏?•Ê??àÁ??ªË©±?üÁ¢º';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Ë´ãËº∏?•Â?Á¢?;
    } else if (formData.password.length < 8) {
      newErrors.password = 'ÂØÜÁ¢º?≥Â??ÄË¶?8 ?ãÂ?Á¨?;
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Ë´ãÁ¢∫Ë™çÂ?Á¢?;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'ÂØÜÁ¢º‰∏çÂåπ??;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Ë´ãËº∏?•Âá∫?üÊó•??;
    }
    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = 'Ë´ãËº∏?•Á??•ËÅØÁµ°‰∫∫';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Ë´ãËº∏?•‰??Ä';
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
      // Remove confirmPassword before sending
      const { confirmPassword, ...submitData } = formData;
      console.log('Submitting registration:', submitData);
      
      // Call the onRegister callback
      onRegister(formData);
      
      // Show success message
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    // Reset form
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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Âª∫Á?Â∏≥Ë?</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Ê≠•È? {step} / 3</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <span className="text-sm font-medium text-green-700">Ë®ªÂ??êÂ?Ôº?/span>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ÂßìÂ? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ë´ãËº∏?•ÊÇ®?ÑÂ???
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
                  ?ªÂ??µ‰ª∂ <span className="text-red-500">*</span>
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
                  ?ªË©±?üÁ¢º <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="123-456-7890"
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
                  Ë∫´‰ªΩËßíËâ≤ <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-white"
                >
                  <option value="elderly">?∑ËÄ?/option>
                  <option value="caregiver">?ßÈ°ß??/option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ÂØÜÁ¢º <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="?≥Â? 8 ?ãÂ?Á¨?
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
                  Á¢∫Ë?ÂØÜÁ¢º <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="?çÊ¨°Ëº∏ÂÖ•ÂØÜÁ¢º"
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
                  <span className="font-semibold">ÂØÜÁ¢ºË¶ÅÊ?Ôº?/span>
                  <br />
                  ???≥Â? 8 ?ãÂ?Á¨?
                  <br />
                  ???ÖÂê´Â§ßÂ?ÂØ´Â?ÊØçÂ??∏Â?
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ?∫Á??•Ê? <span className="text-red-500">*</span>
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
                  Á∑äÊÄ•ËÅØÁµ°‰∫∫ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder="‰æãÂ?ÔºöÂºµ‰∏?(123-456-7890)"
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
                  ‰ΩèÂ? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Ë´ãËº∏?•ÊÇ®?Ñ‰??Ä"
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

          {/* Progress Bar */}
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

          {/* Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                ËøîÂ?
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                ‰∏ã‰?Ê≠?
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
              >
                ÂÆåÊ?Ë®ªÂ?
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationModal;

