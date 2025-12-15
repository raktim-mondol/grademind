import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, AlertTriangle, CheckCircle, ArrowRight } from '../../grademind/Icons';
import api from '../../utils/api';

const PlanUsageBanner = ({ userId, onUpgradeClick }) => {
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const token = await window.Clerk?.session?.getToken();
                const response = await api.get(`/packages/usage/${userId}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                setUsage(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching usage:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (userId) {
            fetchUsage();
            // Refresh every 30 seconds
            const interval = setInterval(fetchUsage, 30000);
            return () => clearInterval(interval);
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-zinc-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-zinc-200 rounded w-1/2"></div>
            </div>
        );
    }

    if (error || !usage) {
        return null;
    }

    const getPlanBadgeColor = (packageType) => {
        switch (packageType) {
            case 'free':
                return 'bg-zinc-100 text-zinc-700 border-zinc-200';
            case 'basic':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'pro':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'enterprise':
                return 'bg-zinc-900 text-white border-zinc-900';
            default:
                return 'bg-zinc-100 text-zinc-700 border-zinc-200';
        }
    };

    const getProgressColor = (used, limit) => {
        if (limit === -1) return 'bg-green-500';
        const percentage = (used / limit) * 100;
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const shouldShowWarning = (used, limit) => {
        if (limit === -1) return false;
        return (used / limit) >= 0.8;
    };

    // Add defensive checks for usage data structure
    const assignments = usage?.usage?.assignments || { used: 0, limit: 3, remaining: 3 };
    const projects = usage?.usage?.projects || { used: 0, limit: 1, remaining: 1 };
    const showWarning = shouldShowWarning(assignments.used, assignments.limit) ||
        shouldShowWarning(projects.used, projects.limit);

    return (
        <div className={`rounded-xl border-2 overflow-hidden transition-all ${showWarning
            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
            : 'bg-white border-zinc-200'
            }`}>
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${usage.package === 'enterprise' ? 'bg-zinc-900' :
                            usage.package === 'pro' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                                usage.package === 'basic' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                                    'bg-zinc-100'
                            }`}>
                            <Zap className={`w-5 h-5 ${usage.package === 'free' ? 'text-zinc-500' : 'text-white'
                                }`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-zinc-900 capitalize">{usage.package} Plan</h3>
                                {usage.isActive ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                )}
                            </div>
                            <p className="text-xs text-zinc-500">
                                {usage.expiresAt
                                    ? `Expires: ${new Date(usage.expiresAt).toLocaleDateString()}`
                                    : 'Active subscription'
                                }
                            </p>
                        </div>
                    </div>

                    {usage.package !== 'enterprise' && onUpgradeClick && (
                        <button
                            onClick={onUpgradeClick}
                            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:-translate-y-0.5"
                        >
                            <TrendingUp className="w-4 h-4" />
                            Upgrade
                        </button>
                    )}
                </div>
            </div>

            {/* Usage Stats */}
            <div className="p-4 space-y-4">
                {/* Assignments */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zinc-700">Assignments</span>
                        <span className="text-sm font-mono text-zinc-900">
                            {assignments.used} / {assignments.limit === -1 ? '∞' : assignments.limit}
                        </span>
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(assignments.used, assignments.limit)}`}
                            style={{
                                width: assignments.limit === -1
                                    ? '100%'
                                    : `${Math.min((assignments.used / assignments.limit) * 100, 100)}%`
                            }}
                        />
                    </div>
                    {shouldShowWarning(assignments.used, assignments.limit) && (
                        <p className="text-xs text-yellow-700 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {assignments.remaining} remaining - consider upgrading
                        </p>
                    )}
                </div>

                {/* Projects */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zinc-700">Projects</span>
                        <span className="text-sm font-mono text-zinc-900">
                            {projects.used} / {projects.limit === -1 ? '∞' : projects.limit}
                        </span>
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(projects.used, projects.limit)}`}
                            style={{
                                width: projects.limit === -1
                                    ? '100%'
                                    : `${Math.min((projects.used / projects.limit) * 100, 100)}%`
                            }}
                        />
                    </div>
                    {shouldShowWarning(projects.used, projects.limit) && (
                        <p className="text-xs text-yellow-700 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {projects.remaining} remaining - consider upgrading
                        </p>
                    )}
                </div>

                {/* Total Graded */}
                <div className="pt-3 border-t border-zinc-200">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-zinc-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-zinc-900">{usage?.usage?.totalSubmissionsGraded || 0}</div>
                            <div className="text-xs text-zinc-500 mt-1">Submissions Graded</div>
                        </div>
                        <div className="bg-zinc-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-zinc-900">{usage?.usage?.totalProjectSubmissionsGraded || 0}</div>
                            <div className="text-xs text-zinc-500 mt-1">Projects Graded</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="px-4 pb-4">
                <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Available Features</div>
                    <div className="flex flex-wrap gap-1.5">
                        {(usage?.features || ['basic_grading']).map((feature) => (
                            <span
                                key={feature}
                                className="text-xs bg-white border border-zinc-200 text-zinc-700 px-2 py-1 rounded-md font-medium"
                            >
                                {feature.replace(/_/g, ' ')}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanUsageBanner;
