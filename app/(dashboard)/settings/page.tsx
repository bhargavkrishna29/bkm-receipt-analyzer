'use client';

import { useSession } from 'next-auth/react';
import { useData } from '@/components/DataProvider';
import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase-client';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { clearAllReceipts } = useData();
  const user = session?.user;

  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      if (firebaseAuth.currentUser && name !== user?.name) {
        await updateProfile(firebaseAuth.currentUser, { displayName: name });
        await update({ name }); // Update next-auth session
      }
      setSaveMessage('Settings saved successfully.');
    } catch (err) {
      setSaveMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all receipt data? This action cannot be undone.')) {
      try {
        await clearAllReceipts();
        alert('All receipt data cleared.');
      } catch (e) {
        alert('Failed to clear data.');
      }
    }
  };

  return (
    <div className="flex-1 p-margin-mobile md:p-margin-desktop overflow-y-auto">
      <div className="mb-lg">
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Settings</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
          Manage your account preferences, notifications, and data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg max-w-5xl">
        {/* Left Column (Profile & Plan Summary) */}
        <div className="lg:col-span-1 space-y-lg">
          {/* Profile Card */}
          <div className="bg-surface rounded-xl border border-outline-variant shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-lg flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-3xl font-bold mb-md">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
            <h3 className="font-headline-md text-headline-md text-on-background">{name || 'User'}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{user?.email || 'No email'}</p>
          </div>

          {/* Plan Summary Card */}
          <div className="bg-surface rounded-xl border border-outline-variant shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-lg">
            <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">Current Plan</h4>
            <div className="flex items-baseline gap-xs mb-sm">
              <span className="font-headline-lg text-headline-lg text-primary">Free</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">Your current plan includes all basic tracking features.</p>
          </div>
        </div>

        {/* Right Column (Forms & Toggles) */}
        <div className="lg:col-span-2 space-y-lg">
          {/* Account Details */}
          <section className="bg-surface rounded-xl border border-outline-variant shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-lg">
            <h3 className="font-headline-md text-headline-md text-on-background mb-md border-b border-surface-variant pb-sm">Account Details</h3>
            <div className="space-y-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">Full Name</label>
                  <input 
                    className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">Email Address</label>
                  <input 
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface-variant" 
                    type="email" 
                    disabled 
                    value={user?.email || ''}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Financial Preferences */}
          <section className="bg-surface rounded-xl border border-outline-variant shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-lg">
            <h3 className="font-headline-md text-headline-md text-on-background mb-md border-b border-surface-variant pb-sm">Financial Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">Base Currency</label>
                <select className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none">
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section className="bg-surface rounded-xl border border-outline-variant shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-lg">
            <h3 className="font-headline-md text-headline-md text-error mb-md border-b border-surface-variant pb-sm">Data Management</h3>
            <div className="space-y-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
                <div>
                  <h4 className="font-body-md text-body-md font-medium text-error">Clear All Data</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Permanently delete all receipt and expense data.</p>
                </div>
                <button 
                  onClick={handleClearData}
                  className="px-md py-sm bg-error-container text-on-error-container rounded-lg font-label-md text-label-md hover:bg-error hover:text-on-error transition-colors"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-end gap-md pt-md">
            {saveMessage && <span className="text-primary font-body-sm mr-auto">{saveMessage}</span>}
            <button 
              onClick={() => setName(user?.name || '')}
              className="px-lg py-sm border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-lg py-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
