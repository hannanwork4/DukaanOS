import React, { useState, useEffect } from 'react';
import {
  Store,
  User as UserIcon,
  Phone,
  MapPin,
  IndianRupee,
  Save,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Building2,
  Mail
} from 'lucide-react';
import { Business, User } from '../types';
import { api } from '../api/client';
import { useTranslation } from '../i18n/LanguageContext';

interface ProfileProps {
  business: Business | null;
  user?: User | null;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({
  business,
  user,
  onRefresh,
  showToast,
  onOpenAuth,
  onLogout
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: business?.name || '',
    owner_name: business?.owner_name || '',
    email: user?.email || '',
    phone: business?.phone || '',
    address: business?.address || '',
    currency: business?.currency || 'INR'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        owner_name: business.owner_name || '',
        email: user?.email || '',
        phone: business.phone || '',
        address: business.address || '',
        currency: business.currency || 'INR'
      });
    }
  }, [business, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('error', 'Store name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      await api.updateBusiness({
        business_id: business?.id,
        name: formData.name.trim(),
        owner_name: formData.owner_name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        currency: formData.currency
      });

      showToast('success', 'Store and owner profile updated successfully!');
      setHasChanges(false);
      onRefresh();
    } catch (err: any) {
      showToast('error', `Failed to update profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0e0f11] text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
            {business?.name ? business.name[0].toUpperCase() : 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                {business?.name || t('profileTitle')}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 border border-black">
                <CheckCircle2 className="w-3 h-3 text-black" />
                {t('activeStoreBadge')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Store Owner: <span className="font-semibold text-zinc-800">{business?.owner_name || 'Not specified'}</span> • ID: <span className="font-mono text-zinc-400">{business?.id || 'default'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              type="button"
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl border border-black transition-colors cursor-pointer"
            >
              {t('switchAccountBtn')}
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              type="button"
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-black transition-colors cursor-pointer"
            >
              {t('logoutBtn')}
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-black shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6">
        <div className="border-b border-black pb-4">
          <h2 className="text-lg font-bold text-zinc-900">{t('storeDetailsHeader')}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {t('storeDetailsSub')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Store Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-zinc-400" />
              {t('storeNameLabel')} *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Sri Venkateshwara General Store"
              className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-zinc-200 rounded-xl text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-black focus:border-black transition-all"
            />
          </div>

          {/* Owner Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
              {t('ownerNameLabel')} *
            </label>
            <input
              type="text"
              name="owner_name"
              required
              value={formData.owner_name}
              onChange={handleChange}
              placeholder="e.g. Abdul Hannan"
              className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-zinc-200 rounded-xl text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-black focus:border-black transition-all"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-zinc-400" />
              {t('storePhoneLabel')}
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-zinc-200 rounded-xl text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-black focus:border-black transition-all"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              {t('emailLabel')}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. storeowner@gmail.com"
              className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-zinc-200 rounded-xl text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-black focus:border-black transition-all"
            />
          </div>

          {/* Store Location / Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              {t('addressLabel')}
            </label>
            <textarea
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. Main Market, Jagadamba Centre, Visakhapatnam, Andhra Pradesh - 530002"
              className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-zinc-200 rounded-xl text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-black focus:border-black transition-all resize-none"
            />
          </div>

          {/* Operating Currency */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-zinc-400" />
              {t('currencyLabel')}
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-zinc-200 rounded-xl text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-black focus:border-black transition-all"
            >
              <option value="INR">₹ INR (Indian Rupee)</option>
              <option value="USD">$ USD (US Dollar)</option>
              <option value="EUR">€ EUR (Euro)</option>
              <option value="AED">AED (UAE Dirham)</option>
            </select>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 flex items-center justify-between border-t border-zinc-100">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-black" />
            <span>Deterministic Local SQLite / Cloud Sync</span>
          </div>

          <button
            type="submit"
            disabled={isSaving || !hasChanges}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer ${
              hasChanges && !isSaving
                ? 'bg-[#111214] text-white hover:bg-zinc-800'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? t('savingBtn') : t('saveProfileBtn')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

