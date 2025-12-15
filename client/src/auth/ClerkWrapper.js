import React, { createContext, useContext, useState } from 'react';
import * as ClerkReact from '@clerk/clerk-react';

// Check if a valid key is provided (not empty and not a placeholder)
const isValidKey = (key) => {
    if (!key) return false;
    if (key.includes('PLACEHOLDER')) return false;
    if (key.includes('your_publishable_key')) return false;
    return true;
};

const isClerkEnabled = isValidKey(process.env.REACT_APP_CLERK_PUBLISHABLE_KEY);

// --- Mock Implementation ---

const MockAuthContext = createContext(null);

const MockClerkProvider = ({ children }) => {
    const [isSignedIn, setIsSignedIn] = useState(true); // Default to signed in for dev

    const mockUser = {
        id: '000000000000000000000001', // Valid MongoDB ObjectId format for development
        firstName: 'Dev',
        lastName: 'User',
        fullName: 'Dev User',
        primaryEmailAddress: { emailAddress: 'dev@local.test' },
        imageUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
    };

    const value = {
        isSignedIn,
        isLoaded: true,
        user: isSignedIn ? mockUser : null,
        signOut: async () => setIsSignedIn(false),
        signIn: async () => setIsSignedIn(true),
    };

    return (
        <MockAuthContext.Provider value={value}>
            {children}
        </MockAuthContext.Provider>
    );
};

// --- Conditional Exports ---

// We define the hooks based on the environment variable *outside* the hook body
// to avoid "React Hook called conditionally" errors.

let useAuth;
let useUser;
let SignIn;
let SignUp;
let ClerkProvider;

if (isClerkEnabled) {
    // Real Clerk implementation
    useAuth = ClerkReact.useAuth;
    useUser = ClerkReact.useUser;
    SignIn = ClerkReact.SignIn;
    SignUp = ClerkReact.SignUp;
    ClerkProvider = ClerkReact.ClerkProvider;
} else {
    // Mock implementation
    useAuth = () => {
        const context = useContext(MockAuthContext);
        if (!context) {
            return { isSignedIn: false, isLoaded: true, signOut: () => { } };
        }
        return {
            isSignedIn: context.isSignedIn,
            isLoaded: context.isLoaded,
            signOut: context.signOut,
        };
    };

    useUser = () => {
        const context = useContext(MockAuthContext);
        return {
            user: context?.user || null,
            isLoaded: context?.isLoaded || true,
            isSignedIn: context?.isSignedIn || false,
        };
    };

    SignIn = (props) => {
        const { signIn } = useContext(MockAuthContext);
        return (
            <div className="p-8 bg-white rounded-lg shadow-lg text-center border border-gray-200">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Development Mode</h2>
                <p className="mb-6 text-gray-600">Clerk authentication is disabled because no valid publishable key was found.</p>
                <button
                    onClick={signIn}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Mock Sign In
                </button>
            </div>
        );
    };

    SignUp = (props) => {
        const { signIn } = useContext(MockAuthContext);
        return (
            <div className="p-8 bg-white rounded-lg shadow-lg text-center border border-gray-200">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Development Mode</h2>
                <p className="mb-6 text-gray-600">Clerk authentication is disabled because no valid publishable key was found.</p>
                <button
                    onClick={signIn}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Mock Sign Up
                </button>
            </div>
        );
    };

    ClerkProvider = ({ children, ...props }) => {
        console.warn('⚠️ Clerk Wrapper: Running in Development Mode (Mock Auth)');
        return <MockClerkProvider>{children}</MockClerkProvider>;
    };
}

export { useAuth, useUser, SignIn, SignUp, ClerkProvider };
