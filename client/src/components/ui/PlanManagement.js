import React, { useState, useEffect } from 'react';
import { Check, Zap, Shield, Sparkles, ArrowRight, AlertTriangle, TrendingUp } from '../../grademind/Icons';
import api from '../../utils/api';

const PlanManagement = ({ userId, currentPlan, onBack }) => {
    const [plans, setPlans] = useState(null);
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [upgrading, setUpgrading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await window.Clerk?.session?.getToken();

                // Fetch available plans
                const plansResponse = await api.get('/packages/plans', {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                setPlans(plansResponse.data.plans);

                // Fetch current usage
                const usageResponse = await api.get(`/packages/usage/${userId}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                setUsage(usageResponse.data);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching plan data:', error);
                setLoading(false);
            }
        };

        if (userId) {
            fetchData();
        }
    }, [userId]);

    const handleUpgrade = async (planType) => {
        if (upgrading) return;

        setUpgrading(true);
        setSelectedPlan(planType);

        try {
            const token = await window.Clerk?.session?.getToken();

            const response = await api.put(`/packages/upgrade/${userId}`, {
                packageType: planType,
                duration: 30 // 30 days
            }, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            alert(`Successfully upgraded to ${planType} plan!`);

            // Refresh usage data
            const usageResponse = await api.get(`/packages/usage/${userId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            setUsage(usageResponse.data);

        } catch (error) {
            console.error('Error upgrading plan:', error);
            alert(`Failed to upgrade: ${error.response?.data?.error || error.message}`);
        } finally {
            setUpgrading(false);
            setSelectedPlan(null);
        }
    };

    const getPlanIcon = (planType) => {
        switch (planType) {
            case 'free':
                return Sparkles;
            case 'basic':
                return Check;
            case 'pro':
                return Zap;
            case 'enterprise':
                return Shield;
            default:
                return Sparkles;
        }
    };

    const getPlanPrice = (planType) => {
        switch (planType) {
            case 'free':
                return { amount: 0, period: 'forever' };
            case 'basic':
                return { amount: 9, period: 'month' };
            case 'pro':
                return { amount: 29, period: 'month' };
            case 'enterprise':
                return { amount: null, period: 'custom' };
            default:
                return { amount: 0, period: 'month' };
        }
    };

    const getPlanFeatures = (planType) => {
        if (!plans || !plans[planType]) return [];

        const plan = plans[planType];
        const features = [];

        if (plan.maxAssignments === -1) {
            features.push('Unlimited Assignments');
        } else {
            features.push(`Up to ${plan.maxAssignments} Assignments`);
        }

        if (plan.maxProjects === -1) {
            features.push('Unlimited Projects');
        } else {
            features.push(`Up to ${plan.maxProjects} Projects`);
        }

        if (plan.maxSubmissionsPerAssignment === -1) {
            features.push('Unlimited Submissions');
        } else {
            features.push(`${plan.maxSubmissionsPerAssignment} Submissions per Assignment`);
        }

        return [...features, ...plan.features.map(f => f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-zinc-500">Loading plans...</div>
            </div>
        );
    }

    const planOrder = ['free', 'basic', 'pro', 'enterprise'];

    return (
        <div className="min-h-screen bg-white text-zinc-900">
            {/* Header */}
            <nav className="border-b border-zinc-200 bg-white sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Plan Management</h1>
                        <p className="text-sm text-zinc-500 mt-1">Choose the perfect plan for your needs</p>
                    </div>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                            ← Back
                        </button>
                    )}
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Current Usage Summary */}
                {usage && (
                    <div className="mb-12 bg-gradient-to-br from-zinc-50 to-white rounded-2xl border-2 border-zinc-200 p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold mb-2">Your Current Plan</h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-bold capitalize">{usage.package}</span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${usage.isActive
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-red-100 text-red-700 border border-red-200'
                                        }`}>
                                        {usage.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            {usage.package !== 'enterprise' && (
                                <div className="text-right">
                                    <div className="text-sm text-zinc-500 mb-1">Upgrade to unlock more</div>
                                    <div className="flex items-center gap-2 text-zinc-900">
                                        <TrendingUp className="w-5 h-5" />
                                        <span className="font-bold">Save time & grade more</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-zinc-200">
                                <div className="text-sm text-zinc-500 mb-1">Assignments</div>
                                <div className="text-2xl font-bold text-zinc-900">
                                    {usage.usage.assignments.used} / {usage.usage.assignments.limit === -1 ? '∞' : usage.usage.assignments.limit}
                                </div>
                                <div className="text-xs text-zinc-500 mt-1">
                                    {usage.usage.assignments.remaining === 'unlimited'
                                        ? 'Unlimited'
                                        : `${usage.usage.assignments.remaining} remaining`}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-zinc-200">
                                <div className="text-sm text-zinc-500 mb-1">Projects</div>
                                <div className="text-2xl font-bold text-zinc-900">
                                    {usage.usage.projects.used} / {usage.usage.projects.limit === -1 ? '∞' : usage.usage.projects.limit}
                                </div>
                                <div className="text-xs text-zinc-500 mt-1">
                                    {usage.usage.projects.remaining === 'unlimited'
                                        ? 'Unlimited'
                                        : `${usage.usage.projects.remaining} remaining`}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-zinc-200">
                                <div className="text-sm text-zinc-500 mb-1">Graded</div>
                                <div className="text-2xl font-bold text-zinc-900">
                                    {usage.usage.totalSubmissionsGraded}
                                </div>
                                <div className="text-xs text-zinc-500 mt-1">Total submissions</div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-zinc-200">
                                <div className="text-sm text-zinc-500 mb-1">Last Active</div>
                                <div className="text-lg font-bold text-zinc-900">
                                    {new Date(usage.lastActivity).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-zinc-500 mt-1">Activity date</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {planOrder.map((planType) => {
                        if (!plans || !plans[planType]) return null;

                        const Icon = getPlanIcon(planType);
                        const price = getPlanPrice(planType);
                        const features = getPlanFeatures(planType);
                        const isCurrentPlan = usage?.package === planType;
                        const isUpgrade = planOrder.indexOf(planType) > planOrder.indexOf(usage?.package || 'free');

                        return (
                            <div
                                key={planType}
                                className={`rounded-2xl border-2 transition-all duration-300 ${planType === 'pro'
                                    ? 'bg-gradient-to-br from-purple-50 to-white border-purple-200 transform md:-translate-y-2 shadow-xl'
                                    : isCurrentPlan
                                        ? 'bg-gradient-to-br from-green-50 to-white border-green-200'
                                        : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-lg'
                                    }`}
                            >
                                {planType === 'pro' && (
                                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold px-4 py-2 text-center rounded-t-xl">
                                        MOST POPULAR
                                    </div>
                                )}

                                <div className="p-6">
                                    {/* Icon & Title */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${planType === 'enterprise' ? 'bg-zinc-900' :
                                        planType === 'pro' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                                            planType === 'basic' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                                                'bg-zinc-100'
                                        }`}>
                                        <Icon className={`w-6 h-6 ${planType === 'free' ? 'text-zinc-600' : 'text-white'
                                            }`} />
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 capitalize">{planType}</h3>

                                    {/* Price */}
                                    <div className="mb-6">
                                        {price.amount === null ? (
                                            <div className="text-3xl font-bold">Custom</div>
                                        ) : (
                                            <div>
                                                <span className="text-4xl font-bold">${price.amount}</span>
                                                <span className="text-zinc-500">/{price.period}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* CTA Button */}
                                    {isCurrentPlan ? (
                                        <div className="w-full py-3 rounded-lg bg-green-100 text-green-700 font-medium text-center border border-green-200 mb-6">
                                            Current Plan
                                        </div>
                                    ) : isUpgrade ? (
                                        <button
                                            onClick={() => handleUpgrade(planType)}
                                            disabled={upgrading}
                                            className={`w-full py-3 rounded-lg font-medium transition-all mb-6 flex items-center justify-center gap-2 ${planType === 'pro'
                                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
                                                : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                                                } ${upgrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {upgrading && selectedPlan === planType ? (
                                                'Upgrading...'
                                            ) : planType === 'enterprise' ? (
                                                'Contact Sales'
                                            ) : (
                                                <>
                                                    Upgrade Now <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-full py-3 rounded-lg bg-zinc-100 text-zinc-400 font-medium text-center border border-zinc-200 mb-6">
                                            Lower Tier
                                        </div>
                                    )}

                                    {/* Features */}
                                    <div className="space-y-3">
                                        {features.slice(0, 6).map((feature, index) => (
                                            <div key={index} className="flex items-start gap-2 text-sm">
                                                <Check className="w-4 h-4 text-zinc-900 mt-0.5 flex-shrink-0" />
                                                <span className="text-zinc-700">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Plan Comparison Table */}
                <div className="mt-16">
                    <h2 className="text-2xl font-bold mb-6 text-center">Detailed Comparison</h2>
                    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="text-left p-4 font-bold text-zinc-900">Feature</th>
                                    {planOrder.map(plan => (
                                        <th key={plan} className="text-center p-4 font-bold text-zinc-900 capitalize">{plan}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                <tr>
                                    <td className="p-4 font-medium text-zinc-700">Max Assignments</td>
                                    {planOrder.map(plan => (
                                        <td key={plan} className="p-4 text-center text-zinc-900 font-mono">
                                            {plans?.[plan]?.maxAssignments === -1 ? '∞' : plans?.[plan]?.maxAssignments}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="bg-zinc-50">
                                    <td className="p-4 font-medium text-zinc-700">Max Projects</td>
                                    {planOrder.map(plan => (
                                        <td key={plan} className="p-4 text-center text-zinc-900 font-mono">
                                            {plans?.[plan]?.maxProjects === -1 ? '∞' : plans?.[plan]?.maxProjects}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-medium text-zinc-700">Submissions per Assignment</td>
                                    {planOrder.map(plan => (
                                        <td key={plan} className="p-4 text-center text-zinc-900 font-mono">
                                            {plans?.[plan]?.maxSubmissionsPerAssignment === -1 ? '∞' : plans?.[plan]?.maxSubmissionsPerAssignment}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="bg-zinc-50">
                                    <td className="p-4 font-medium text-zinc-700">Excel Export</td>
                                    {planOrder.map(plan => (
                                        <td key={plan} className="p-4 text-center">
                                            {plans?.[plan]?.features?.includes('excel_export') ? (
                                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                                            ) : (
                                                <span className="text-zinc-300">—</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-medium text-zinc-700">Priority Processing</td>
                                    {planOrder.map(plan => (
                                        <td key={plan} className="p-4 text-center">
                                            {plans?.[plan]?.features?.includes('priority_processing') ? (
                                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                                            ) : (
                                                <span className="text-zinc-300">—</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="bg-zinc-50">
                                    <td className="p-4 font-medium text-zinc-700">API Access</td>
                                    {planOrder.map(plan => (
                                        <td key={plan} className="p-4 text-center">
                                            {plans?.[plan]?.features?.includes('api_access') ? (
                                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                                            ) : (
                                                <span className="text-zinc-300">—</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanManagement;
