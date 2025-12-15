import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Pricing from './Pricing';
import { User, Bell, Shield, CreditCard, Trash2, Save } from 'lucide-react';
import { useUser } from '../auth/ClerkWrapper';
import api from '../utils/api';

const Settings = ({ activeView, onViewChange, onLogout }) => {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [usage, setUsage] = useState(null);

    // Profile settings state
    const [profileData, setProfileData] = useState({
        fullName: user?.fullName || '',
        email: user?.primaryEmailAddress?.emailAddress || '',
        institution: '',
        role: 'educator',
    });

    // Notification settings state
    const [notifications, setNotifications] = useState({
        emailGradingComplete: true,
        emailWeeklySummary: false,
        emailProductUpdates: true,
        pushGradingComplete: false,
    });

    // Fetch usage data
    useEffect(() => {
        const fetchUsage = async () => {
            if (!user?.id) return;

            try {
                const token = await window.Clerk?.session?.getToken();
                const response = await api.get(`/packages/usage/${user.id}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                setUsage(response.data);
            } catch (error) {
                console.error('Error fetching usage:', error);
            }
        };

        fetchUsage();
    }, [user?.id, showPricing]); // Refetch when returning from pricing

    const handleSaveProfile = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        alert('Profile updated successfully!');
    };

    const handleSaveNotifications = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        alert('Notification preferences updated!');
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'billing', label: 'Billing', icon: CreditCard },
    ];

    // If showing pricing page, render only that
    if (showPricing) {
        return (
            <Pricing
                onSelectPlan={(plan) => {
                    console.log('Selected plan:', plan);
                    alert(`Upgrade to ${plan} plan - Payment integration coming soon!`);
                    setShowPricing(false);
                }}
                onBack={() => setShowPricing(false)}
            />
        );
    }

    return (
        <AppLayout activeView={activeView} onViewChange={onViewChange} onLogout={onLogout}>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-black tracking-tight">Settings</h1>
                    <p className="text-zinc-500 mt-1">Manage your account settings and preferences.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg w-fit overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-zinc-500 hover:text-black'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <Card>
                        <CardHeader title="Profile Information" subtitle="Update your personal details" />
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 pb-6 border-b border-zinc-100">
                                <img
                                    src={user?.imageUrl || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=000000&color=fff`}
                                    alt="Profile"
                                    className="w-20 h-20 rounded-full"
                                />
                                <div>
                                    <h3 className="font-semibold text-black">{user?.fullName || 'User'}</h3>
                                    <p className="text-sm text-zinc-500">{user?.primaryEmailAddress?.emailAddress}</p>
                                </div>
                            </div>

                            <Input
                                label="Full Name"
                                value={profileData.fullName}
                                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                placeholder="John Doe"
                            />

                            <Input
                                label="Email Address"
                                type="email"
                                value={profileData.email}
                                disabled
                                className="bg-zinc-50"
                            />

                            <Input
                                label="Institution"
                                value={profileData.institution}
                                onChange={(e) => setProfileData({ ...profileData, institution: e.target.value })}
                                placeholder="University Name"
                            />

                            <div>
                                <label className="block text-sm font-medium text-black mb-1.5">Role</label>
                                <select
                                    value={profileData.role}
                                    onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm shadow-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 hover:border-zinc-300 transition-all"
                                >
                                    <option value="educator">Educator</option>
                                    <option value="ta">Teaching Assistant</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            <div className="pt-4">
                                <Button onClick={handleSaveProfile} isLoading={isSaving} icon={Save}>
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <Card>
                        <CardHeader title="Notification Preferences" subtitle="Choose how you want to be notified" />
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-black">Email Notifications</h3>

                                <label className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer">
                                    <div>
                                        <p className="font-medium text-black">Grading Complete</p>
                                        <p className="text-sm text-zinc-500">Get notified when AI grading finishes</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notifications.emailGradingComplete}
                                        onChange={(e) => setNotifications({ ...notifications, emailGradingComplete: e.target.checked })}
                                        className="w-5 h-5 accent-black rounded focus:ring-black"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer">
                                    <div>
                                        <p className="font-medium text-black">Weekly Summary</p>
                                        <p className="text-sm text-zinc-500">Receive a weekly summary of your grading activity</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notifications.emailWeeklySummary}
                                        onChange={(e) => setNotifications({ ...notifications, emailWeeklySummary: e.target.checked })}
                                        className="w-5 h-5 accent-black rounded focus:ring-black"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer">
                                    <div>
                                        <p className="font-medium text-black">Product Updates</p>
                                        <p className="text-sm text-zinc-500">Stay informed about new features and improvements</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={notifications.emailProductUpdates}
                                        onChange={(e) => setNotifications({ ...notifications, emailProductUpdates: e.target.checked })}
                                        className="w-5 h-5 accent-black rounded focus:ring-black"
                                    />
                                </label>
                            </div>

                            <div className="pt-4">
                                <Button onClick={handleSaveNotifications} isLoading={isSaving} icon={Save}>
                                    Save Preferences
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader title="Password" subtitle="Manage your password" />
                            <div className="space-y-4">
                                <p className="text-sm text-zinc-600">
                                    Your account is secured through Clerk authentication. To change your password, please use the account management portal.
                                </p>
                                <Button variant="secondary" onClick={() => window.open('https://accounts.clerk.dev', '_blank')}>
                                    Manage Password
                                </Button>
                            </div>
                        </Card>

                        <Card>
                            <CardHeader title="Two-Factor Authentication" subtitle="Add an extra layer of security" />
                            <div className="space-y-4">
                                <p className="text-sm text-zinc-600">
                                    Enable two-factor authentication for enhanced account security.
                                </p>
                                <Button variant="secondary">
                                    Enable 2FA
                                </Button>
                            </div>
                        </Card>

                        <Card>
                            <CardHeader title="Active Sessions" subtitle="Manage your active sessions" />
                            <div className="space-y-4">
                                <div className="p-4 border border-zinc-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-black">Current Session</p>
                                            <p className="text-sm text-zinc-500">Windows • Chrome • {new Date().toLocaleDateString()}</p>
                                        </div>
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Billing Tab */}
                {activeTab === 'billing' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader title="Current Plan" subtitle="Manage your subscription" />
                            <div className="space-y-4">
                                <div className="p-6 bg-gradient-to-br from-zinc-50 to-white border-2 border-zinc-200 rounded-2xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-black capitalize">
                                                {usage?.package || 'Free'} Plan
                                            </h3>
                                            <p className="text-zinc-500">
                                                {usage?.package === 'free' && 'Free forever'}
                                                {usage?.package === 'basic' && '$9/month'}
                                                {usage?.package === 'pro' && '$29/month'}
                                                {usage?.package === 'enterprise' && 'Custom pricing'}
                                                {!usage?.package && 'Free forever'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-bold text-black">
                                                {usage?.package === 'free' && '$0'}
                                                {usage?.package === 'basic' && '$9'}
                                                {usage?.package === 'pro' && '$29'}
                                                {usage?.package === 'enterprise' && 'Custom'}
                                                {!usage?.package && '$0'}
                                            </p>
                                            <p className="text-sm text-zinc-500">/month</p>
                                        </div>
                                    </div>

                                    {/* Usage Stats */}
                                    {usage && (
                                        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-200">
                                            <div className="bg-white rounded-lg p-4 border border-zinc-200">
                                                <p className="text-sm text-zinc-500 mb-1">Lifetime Assignments</p>
                                                <p className="text-2xl font-bold text-black">
                                                    {usage.usage.assignments?.lifetimeUsed || 0} / {usage.usage.assignments?.limit === -1 ? '∞' : (usage.usage.assignments?.limit || 0)}
                                                </p>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 border border-zinc-200">
                                                <p className="text-sm text-zinc-500 mb-1">Lifetime Projects</p>
                                                <p className="text-2xl font-bold text-black">
                                                    {usage.usage.projects?.lifetimeUsed || 0} / {usage.usage.projects?.limit === -1 ? '∞' : (usage.usage.projects?.limit || 0)}
                                                </p>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 border border-zinc-200 col-span-2">
                                                <p className="text-sm text-zinc-500 mb-1">Lifetime Student Submissions</p>
                                                <p className="text-2xl font-bold text-black">
                                                    {usage.usage.submissions?.lifetimeUsed || 0} / {usage.usage.submissions?.limit === -1 ? '∞' : (usage.usage.submissions?.limit || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 text-sm text-zinc-600 mt-4">
                                        {usage?.features?.map((feature, index) => (
                                            <p key={index}>✓ {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                                        )) || (
                                                <>
                                                    <p>✓ Basic AI Grading</p>
                                                    <p>✓ Limited Assignments</p>
                                                    <p>✓ Limited Projects</p>
                                                </>
                                            )}
                                    </div>
                                </div>

                                {(!usage || usage?.package !== 'enterprise') && (
                                    <div className="flex gap-3">
                                        <Button
                                            variant="primary"
                                            onClick={() => setShowPricing(true)}
                                            className="flex-1"
                                        >
                                            {!usage || usage?.package === 'free' ? 'Upgrade to Pro' : 'Manage Plan'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => setShowPricing(true)}
                                        >
                                            View All Plans
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card>
                            <CardHeader title="Billing History" subtitle="View your past invoices" />
                            <div className="text-center py-8 text-zinc-500">
                                <p>No billing history available</p>
                                <p className="text-sm mt-2">Your invoices will appear here once you upgrade to a paid plan</p>
                            </div>
                        </Card>

                        <Card>
                            <CardHeader title="Danger Zone" subtitle="Irreversible actions" />
                            <div className="space-y-4">
                                <div className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                                    <h4 className="font-semibold text-red-900 mb-2">Delete Account</h4>
                                    <p className="text-sm text-red-700 mb-4">
                                        Once you delete your account, there is no going back. All your data will be permanently deleted.
                                    </p>
                                    <Button variant="danger" icon={Trash2}>
                                        Delete Account
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default Settings;
