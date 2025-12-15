import React from 'react';
import { X, AlertTriangle, TrendingUp, Check } from '../../grademind/Icons';

const PlanLimitModal = ({ isOpen, onClose, limitInfo, onUpgrade }) => {
    if (!isOpen) return null;

    const getPlanUpgradeInfo = (currentPlan) => {
        const upgradePath = {
            free: {
                nextPlan: 'basic',
                benefits: [
                    '10 Assignments (vs 3)',
                    '50 Submissions per Assignment (vs 10)',
                    '5 Projects (vs 1)',
                    'Excel Export Feature'
                ],
                price: '$9/month'
            },
            basic: {
                nextPlan: 'pro',
                benefits: [
                    '50 Assignments (vs 10)',
                    '200 Submissions per Assignment (vs 50)',
                    '25 Projects (vs 5)',
                    'Priority Processing',
                    'Orchestration Features'
                ],
                price: '$29/month'
            },
            pro: {
                nextPlan: 'enterprise',
                benefits: [
                    'Unlimited Everything',
                    'API Access',
                    'Custom Branding',
                    'Dedicated Support'
                ],
                price: 'Custom Pricing'
            }
        };

        return upgradePath[currentPlan] || upgradePath.free;
    };

    const upgradeInfo = getPlanUpgradeInfo(limitInfo?.package || 'free');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <AlertTriangle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Plan Limit Reached</h2>
                            <p className="text-white text-opacity-90 mt-1">
                                You've reached your {limitInfo?.package} plan limit
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Current Limit Info */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-bold text-yellow-900 mb-1">Current Limit</h3>
                                <p className="text-sm text-yellow-800">
                                    {limitInfo?.message || 'You have reached your plan limit.'}
                                </p>
                                {limitInfo?.limit && (
                                    <div className="mt-2 text-xs font-mono text-yellow-700">
                                        {limitInfo.current} / {limitInfo.limit} used
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Upgrade Benefits */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-zinc-900" />
                            <h3 className="font-bold text-zinc-900">
                                Upgrade to {upgradeInfo.nextPlan.charAt(0).toUpperCase() + upgradeInfo.nextPlan.slice(1)}
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {upgradeInfo.benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Check className="w-4 h-4 text-green-600" />
                                    </div>
                                    <span className="text-sm text-zinc-700">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-1">
                                        Starting at
                                    </div>
                                    <div className="text-2xl font-bold text-zinc-900">{upgradeInfo.price}</div>
                                </div>
                                <button
                                    onClick={() => {
                                        onClose();
                                        onUpgrade?.();
                                    }}
                                    className="bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 text-white px-6 py-3 rounded-lg font-medium transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    Upgrade Now
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="text-xs text-zinc-500 text-center pt-4 border-t border-zinc-200">
                        You can upgrade anytime to unlock more capacity and features
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanLimitModal;
