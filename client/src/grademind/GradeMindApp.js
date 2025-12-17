import React, { useState, useEffect } from 'react';
import { useAuth, useUser, SignIn, SignUp } from '../auth/ClerkWrapper';
import api from '../utils/api';
import Landing from './Landing';
import Dashboard from './Dashboard';
import Workspaces from './Workspaces';
import Pricing from './Pricing';
import Docs from './Docs';
import Privacy from './Privacy';
import Terms from './Terms';
import Settings from './Settings';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const AppView = {
  LANDING: 'LANDING',
  PRICING: 'PRICING',
  WORKSPACES: 'WORKSPACES',
  SETUP: 'SETUP',
  DASHBOARD: 'DASHBOARD',
  DOCS: 'DOCS',
  PRIVACY: 'PRIVACY',
  TERMS: 'TERMS',
  SETTINGS: 'SETTINGS',
  SIGN_IN: 'SIGN_IN',
  SIGN_UP: 'SIGN_UP'
};

function GradeMindApp() {
  const { isSignedIn, isLoaded, signOut, getToken } = useAuth();
  const { user } = useUser();
  const [view, setView] = useState(AppView.LANDING);
  const [assignments, setAssignments] = useState([]);
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);

  const [landingPage, setLandingPage] = useState('home');

  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'danger'
  });

  const closeConfirmation = () => {
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  };



  // Load assignments and projects from backend API (with localStorage fallback)
  useEffect(() => {
    if (isSignedIn && user) {
      const fetchFromBackend = async () => {
        try {
          // Get auth token from Clerk
          const token = await getToken();

          // Fetch assignments from backend
          const assignmentsResponse = await api.get('/assignments', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });

          if (assignmentsResponse.data?.assignments) {
            // Transform backend assignments to local format
            const backendAssignments = assignmentsResponse.data.assignments.map(a => ({
              id: a._id,
              config: {
                title: a.title,
                description: a.description,
                totalScore: a.totalPoints,
                assignmentFile: a.assignmentFile ? { name: a.assignmentFile.split('/').pop() } : undefined,
                rubricFile: a.rubricFile ? { name: a.rubricFile.split('/').pop() } : undefined,
                solutionFile: a.solutionFile ? { name: a.solutionFile.split('/').pop() } : undefined,
              },
              sections: (a.sections || []).map(s => ({
                ...s,
                id: s._id || s.id || crypto.randomUUID(), // Ensure id exists
                name: s.name || s.title || 'Section', // Transform title to name
                students: s.students || []
              })),
              submissionCount: a.submissionCount || 0,
              createdAt: a.createdAt ? (typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime()) : Date.now(),
              backendId: a._id,
              processingStatus: a.processingStatus
            }));

            setAssignments(backendAssignments);
            console.log('✅ Loaded', backendAssignments.length, 'assignments from backend');
          }

        } catch (error) {
          console.error('❌ Error fetching from backend, falling back to localStorage:', error);

          // Fallback to localStorage
          const assignmentKey = `grademind-assignments-${user.id}`;

          const savedAssignments = localStorage.getItem(assignmentKey);
          if (savedAssignments) {
            try {
              setAssignments(JSON.parse(savedAssignments));
            } catch (e) {
              console.error('Failed to load saved assignments:', e);
            }
          }
        }
      };

      fetchFromBackend();
    }
  }, [isSignedIn, user]);

  // Save assignments to localStorage whenever they change (keyed by user ID)
  useEffect(() => {
    if (isSignedIn && user) {
      const storageKey = `grademind-assignments-${user.id}`;
      // Remove large file data before saving to localStorage to prevent quota errors
      const assignmentsToSave = assignments.map(a => ({
        ...a,
        config: a.config ? {
          ...a.config,
          // Remove base64 file data - only keep file names
          assignmentFile: a.config.assignmentFile ? { name: a.config.assignmentFile.name } : undefined,
          rubricFile: a.config.rubricFile ? { name: a.config.rubricFile.name } : undefined,
          solutionFile: a.config.solutionFile ? { name: a.config.solutionFile.name } : undefined,
        } : a.config
      }));
      try {
        localStorage.setItem(storageKey, JSON.stringify(assignmentsToSave));
      } catch (error) {
        console.error('Failed to save assignments to localStorage:', error);
      }
    }
  }, [assignments, isSignedIn, user]);

  // Redirect to workspaces when user signs in
  useEffect(() => {
    if (isLoaded && isSignedIn && (view === AppView.SIGN_IN || view === AppView.SIGN_UP || view === AppView.LANDING)) {
      setView(AppView.WORKSPACES);
    }
  }, [isLoaded, isSignedIn, view]);

  // Handle hash changes for Clerk's internal navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('sign-in')) {
        setView(AppView.SIGN_IN);
      } else if (hash.includes('sign-up')) {
        setView(AppView.SIGN_UP);
      } else if (hash.includes('workspaces')) {
        if (isSignedIn) {
          setView(AppView.WORKSPACES);
        }
      }
      // Clear the hash after handling
      if (hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isSignedIn]);

  // Unified navigation handler
  const handleNavigate = (destination) => {
    window.scrollTo(0, 0);

    // Check if destination is a sub-page of Landing (about, blog, contact, security, api)
    if (['about', 'blog', 'contact', 'security', 'api', 'home'].includes(destination)) {
      setLandingPage(destination);
      setView(AppView.LANDING);
    } else if (AppView[destination.toUpperCase()]) {
      // It's a top-level view
      setView(AppView[destination.toUpperCase()]);
    } else {
      console.warn(`Unknown navigation destination: ${destination}`);
      setView(AppView.LANDING);
      setLandingPage('home');
    }
  };

  const handleStart = () => {
    window.scrollTo(0, 0);
    setView(AppView.PRICING);
  };

  const handleSignIn = () => {
    setView(AppView.SIGN_IN);
  };

  const handleSignUp = () => {
    setView(AppView.SIGN_UP);
  };

  // Check for Payment Redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (paymentStatus === 'success' && sessionId && isSignedIn) {
      console.log('✅ Payment success detected. Verifying session...');
      const verifyPayment = async () => {
        try {
          const token = await getToken();
          const response = await api.get(`/payments/verify-session?sessionId=${sessionId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });

          if (response.data.success) {
            console.log('✅ Payment verified:', response.data.message);
            alert('Payment successful! Your plan has been upgraded to Pro.');

            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);

            // Navigate to settings (billing tab) or dashboard
            setView(AppView.SETTINGS);
          } else {
            console.warn('⚠️ Payment not verified:', response.data);
            alert('Payment could not be verified automatically. Please contact support if issues persist.');
          }
        } catch (err) {
          console.error('Error verifying payment:', err);
          alert('Error verifying payment status. Please refresh or contact support.');
        }
      };
      verifyPayment();
    } else if (paymentStatus === 'cancelled') {
      alert('Payment was cancelled.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isSignedIn, getToken]);

  const handlePlanSelect = async (plan) => {
    console.log(`Selected plan: ${plan}`);
    if (isSignedIn) {
      if (plan === 'Pro') {
        try {
          const token = await getToken();
          const response = await api.post('/payments/create-checkout-session', {
            packageType: 'pro'
          }, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });

          if (response.data.url) {
            window.location.href = response.data.url;
          }
        } catch (err) {
          console.error('Payment error:', err);
          alert('Failed to initiate payment. Please try again.');
        }
      } else {
        setView(AppView.WORKSPACES);
      }
    } else {
      setView(AppView.SIGN_UP);
    }
  };

  const handleCreateAssignment = async (config) => {
    try {
      // Create FormData for multipart upload
      const formData = new FormData();

      // Add basic fields
      formData.append('title', config.title);
      formData.append('totalPoints', config.totalScore || 100);
      formData.append('description', config.description || '');

      // Helper to convert base64 to Blob
      const base64ToBlob = (base64Data, mimeType) => {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
      };

      // Handle assignment PDF file or text
      if (config.assignmentFile) {
        const blob = base64ToBlob(config.assignmentFile.data, config.assignmentFile.mimeType);
        formData.append('assignment', blob, config.assignmentFile.name);
      } else if (config.assignmentText) {
        // Send assignment text as a text field
        formData.append('assignmentText', config.assignmentText);
      }

      // Handle rubric file
      if (config.rubricFile) {
        const blob = base64ToBlob(config.rubricFile.data, config.rubricFile.mimeType);
        formData.append('rubric', blob, config.rubricFile.name);
      } else if (config.rubric) {
        const blob = new Blob([config.rubric], { type: 'text/plain' });
        formData.append('rubric', blob, 'rubric.txt');
      }

      // Handle solution file
      if (config.solutionFile) {
        const blob = base64ToBlob(config.solutionFile.data, config.solutionFile.mimeType);
        formData.append('solution', blob, config.solutionFile.name);
      } else if (config.solution) {
        const blob = new Blob([config.solution], { type: 'text/plain' });
        formData.append('solution', blob, 'solution.txt');
      }

      // Add AI config as JSON in sections
      const sections = [{
        selectedModels: config.selectedModels || ['gemini-2.5-pro'],
        useAverageGrading: config.useAverageGrading || false
      }];
      formData.append('sections', JSON.stringify(sections));

      console.log('📤 Sending assignment to backend API...');

      // Get auth token from Clerk
      const token = await getToken();

      // POST to backend API
      const response = await api.post('/assignments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      console.log('✅ Assignment created:', response.data);

      // Create local assignment object with backend ID
      const newAssignment = {
        id: response.data.assignment._id,
        config,
        sections: [],
        createdAt: Date.now(),
        backendId: response.data.assignment._id,
        processingStatus: response.data.assignment.processingStatus
      };

      setAssignments(prev => [...prev, newAssignment]);
      setActiveAssignmentId(newAssignment.id);
      setView(AppView.DASHBOARD);

    } catch (error) {
      console.error('❌ Error creating assignment:', error);
      alert(`Failed to create assignment: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUpdateAssignment = (updatedAssignment) => {
    setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
  };

  const handleSelectAssignment = (id) => {
    setActiveAssignmentId(id);
    setView(AppView.DASHBOARD);
  };

  const handleDeleteAssignment = (id) => {
    setConfirmation({
      isOpen: true,
      title: 'Delete Assignment',
      message: 'Are you sure you want to delete this assignment? This action cannot be undone and all associated submissions will be lost.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          console.log('🗑️ Deleting assignment:', id);

          // Get auth token from Clerk
          const token = await getToken();

          // Call backend API to delete
          const response = await api.delete(`/assignments/${id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });

          console.log('✅ Assignment deleted from backend:', id, response.data);

          // Remove from local state
          setAssignments(prev => prev.filter(a => a.id !== id));
          closeConfirmation();
        } catch (error) {
          console.error('❌ Error deleting assignment:', error);
          console.error('Response:', error.response?.data);
          alert(`Failed to delete assignment: ${error.response?.data?.error || error.message}`);
          closeConfirmation();
        }
      }
    });
  };



  const handleLogout = async () => {
    await signOut();
    setView(AppView.LANDING);
    setActiveAssignmentId(null);
    setAssignments([]);
  };

  const activeAssignment = assignments.find(a => a.id === activeAssignmentId);

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.firstName) return user.firstName;
    if (user.fullName) return user.fullName;
    if (user.primaryEmailAddress) return user.primaryEmailAddress.emailAddress.split('@')[0];
    return 'User';
  };

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased text-zinc-900 bg-white min-h-screen selection:bg-zinc-900 selection:text-white">
      {view === AppView.LANDING && (
        <Landing
          activePage={landingPage}
          onNavigate={handleNavigate}
          onStart={handleStart}
          onLogin={handleSignIn}
          onDocs={() => setView(AppView.DOCS)}
          onPrivacy={() => setView(AppView.PRIVACY)}
          onTerms={() => setView(AppView.TERMS)}
        />
      )}

      {view === AppView.SIGN_IN && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
          <div className="mb-8">
            <button
              onClick={() => setView(AppView.LANDING)}
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              &larr; Back to home
            </button>
          </div>
          <SignIn
            routing="hash"
            signUpUrl="#sign-up"
            afterSignInUrl="#workspaces"
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-xl border border-zinc-100 rounded-2xl',
                footerActionLink: 'text-zinc-900 hover:text-zinc-700 font-medium',
              }
            }}
          />
        </div>
      )}

      {view === AppView.SIGN_UP && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
          <div className="mb-8">
            <button
              onClick={() => setView(AppView.LANDING)}
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              &larr; Back to home
            </button>
          </div>
          <SignUp
            routing="hash"
            signInUrl="#sign-in"
            afterSignUpUrl="#workspaces"
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-xl border border-zinc-100 rounded-2xl',
                footerActionLink: 'text-zinc-900 hover:text-zinc-700 font-medium',
              }
            }}
          />
        </div>
      )}

      {view === AppView.PRICING && (
        <Pricing
          onSelectPlan={handlePlanSelect}
          onBack={() => {
            setView(AppView.LANDING);
            setLandingPage('home');
          }}
          onNavigate={handleNavigate}
          onStart={handleStart}
          onDocs={() => setView(AppView.DOCS)}
          onPrivacy={() => setView(AppView.PRIVACY)}
          onTerms={() => setView(AppView.TERMS)}
        />
      )}

      {view === AppView.DOCS && (
        <Docs
          activeView={view}
          onViewChange={setView}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          onStart={handleStart}
          onDocs={() => setView(AppView.DOCS)}
          onPrivacy={() => setView(AppView.PRIVACY)}
          onTerms={() => setView(AppView.TERMS)}
        />
      )}

      {view === AppView.PRIVACY && (
        <Privacy
          onBack={() => {
            setView(AppView.LANDING);
            setLandingPage('home');
          }}
          onNavigate={handleNavigate}
          onStart={handleStart}
          onDocs={() => setView(AppView.DOCS)}
          onPrivacy={() => setView(AppView.PRIVACY)}
          onTerms={() => setView(AppView.TERMS)}
        />
      )}

      {view === AppView.TERMS && (
        <Terms
          onBack={() => {
            setView(AppView.LANDING);
            setLandingPage('home');
          }}
          onNavigate={handleNavigate}
          onStart={handleStart}
          onDocs={() => setView(AppView.DOCS)}
          onPrivacy={() => setView(AppView.PRIVACY)}
          onTerms={() => setView(AppView.TERMS)}
        />
      )}

      {view === AppView.WORKSPACES && isSignedIn && (
        <Workspaces
          assignments={assignments}
          projects={[]}
          onCreateNew={handleCreateAssignment}
          onSelect={handleSelectAssignment}
          onDelete={handleDeleteAssignment}
          onLogout={handleLogout}
          userName={getUserDisplayName()}
          userImageUrl={user?.imageUrl}
          activeView={view}
          onViewChange={setView}
        />
      )}

      {view === AppView.WORKSPACES && !isSignedIn && (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
          <div className="text-center">
            <p className="text-zinc-900 mb-4">Please sign in to access workspaces</p>
            <button
              onClick={() => setView(AppView.SIGN_IN)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-zinc-800"
            >
              Sign In
            </button>
          </div>
        </div>
      )}



      {view === AppView.DASHBOARD && activeAssignment && isSignedIn && (
        <Dashboard
          assignment={activeAssignment}
          onUpdateAssignment={handleUpdateAssignment}
          onBack={() => setView(AppView.WORKSPACES)}
        />
      )}



      {view === AppView.SETTINGS && isSignedIn && (
        <Settings
          activeView={view}
          onViewChange={setView}
          onLogout={handleLogout}
        />
      )}

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={confirmation.onConfirm}
        onCancel={closeConfirmation}
        variant={confirmation.variant}
        confirmText="Delete"
      />
    </div>
  );
}

export default GradeMindApp;
