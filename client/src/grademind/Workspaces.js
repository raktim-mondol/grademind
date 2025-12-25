import React, { useState } from 'react';
import {
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Calendar
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AppLayout } from '../components/layout/AppLayout';

import PlanLimitModal from '../components/ui/PlanLimitModal';
import Pricing from './Pricing';
import SetupForm from './SetupForm';
import { useUser } from '../auth/ClerkWrapper';

const Workspaces = ({
  assignments = [],
  onCreateNew, // Now passed as a prop to handle the actual creation logic
  onSelect,
  onDelete,
  onLogout,
  activeView = 'WORKSPACES',
  onViewChange
}) => {
  const { user } = useUser();
  const [mode, setMode] = useState('LIST'); // 'LIST', 'NEW_ASSIGNMENT', 'PLAN_MANAGEMENT'

  // Plan limit modal state
  const [planLimitModal, setPlanLimitModal] = useState({
    isOpen: false,
    limitInfo: null
  });

  // Filter assignments based on search
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssignments = assignments.filter(a =>
    a.config?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAssignmentComplete = async (config) => {
    try {
      await onCreateNew(config);
      // Don't set mode to LIST here - the parent component (GradeMindApp) will handle
      // navigation after atomic processing completes
    } catch (error) {
      // Check if it's a plan limit error
      if (error.response?.data?.upgradeRequired) {
        setPlanLimitModal({
          isOpen: true,
          limitInfo: error.response.data
        });
      } else {
        // Re-throw other errors to be handled by the caller
        throw error;
      }
    }
  };

  // Render the Header based on mode
  const renderHeader = () => {
    if (mode === 'NEW_ASSIGNMENT') {
      return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
          <button
            onClick={() => setMode('LIST')}
            className="flex items-center text-sm text-zinc-500 hover:text-black transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Workspaces
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-black">New Assignment</h1>
              <p className="text-zinc-500">Create a new grading workflow</p>
            </div>
          </div>
        </div>
      );
    }

    // Default List Header
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">Workspaces</h1>
          <p className="text-zinc-500">Manage your assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black w-64 transition-all hover:border-zinc-300"
            />
          </div>
          <Button 
            onClick={() => setMode('NEW_ASSIGNMENT')} 
            icon={Plus}
            variant="outline"
            className="bg-white border-zinc-200 hover:bg-black hover:text-white hover:border-black"
          >
            New Assignment
          </Button>
        </div>
      </div>
    );
  };

  // Render Content
  if (mode === 'PLAN_MANAGEMENT') {
    return (
      <Pricing
        onSelectPlan={(plan) => {
          console.log('Selected plan:', plan);
          alert(`Upgrade to ${plan} plan - Payment integration coming soon!`);
          setMode('LIST');
        }}
        onBack={() => setMode('LIST')}
      />
    );
  }

  if (mode === 'NEW_ASSIGNMENT') {
    return (
      <AppLayout activeView={activeView} onViewChange={onViewChange} onLogout={onLogout}>
        <div className="max-w-5xl mx-auto">
          {renderHeader()}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in duration-300 h-[650px]">
            <SetupForm
              onComplete={handleCreateAssignmentComplete}
              onCancel={() => setMode('LIST')}
            />
          </div>
        </div>
      </AppLayout>
    );
  }

  // List View
  return (
    <AppLayout activeView={activeView} onViewChange={onViewChange} onLogout={onLogout}>
      <div className="space-y-6">
        {renderHeader()}

        {/* Assignments List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredAssignments.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-xl border-2 border-dashed border-zinc-200">
              <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-zinc-400" />
              </div>
              <h3 className="text-black font-semibold mb-1">No assignments yet</h3>
              <p className="text-zinc-500 text-sm mb-5">Create your first assignment to get started</p>
              <Button size="sm" onClick={() => setMode('NEW_ASSIGNMENT')} icon={Plus}>
                Create Assignment
              </Button>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                onClick={() => onSelect(assignment.id)}
                className="group bg-white p-5 rounded-xl border border-zinc-200 hover:border-black/20 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-zinc-100 rounded-xl group-hover:bg-black group-hover:text-white transition-all duration-300">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-zinc-50 px-2 py-1 rounded-full border border-zinc-100">
                      <Calendar className="w-3 h-3" />
                      {(() => {
                        if (!assignment.createdAt) return 'N/A';
                        const date = new Date(assignment.createdAt);
                        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                      })()}
                    </span>
                    {assignment.processingStatus === 'processing' && (
                      <span className="flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3 animate-spin" />
                        Processing
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🗑️ Delete clicked for:', assignment.id);
                        onDelete(assignment.id);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-black mb-1 group-hover:text-black transition-colors truncate">
                  {assignment.config.title}
                </h3>
                <p className="text-sm text-zinc-500 line-clamp-2 mb-4 h-10">
                  {assignment.config.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {assignment.submissionCount || 0} submissions
                    </span>
                  </div>
                  <span className="text-xs font-medium text-zinc-400 group-hover:text-black transition-colors flex items-center gap-1">
                    Open <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Plan Limit Modal */}
      <PlanLimitModal
        isOpen={planLimitModal.isOpen}
        limitInfo={planLimitModal.limitInfo}
        onClose={() => setPlanLimitModal({ isOpen: false, limitInfo: null })}
        onUpgrade={() => setMode('PLAN_MANAGEMENT')}
      />
    </AppLayout>
  );
};

export default Workspaces;
