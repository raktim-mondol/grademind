import React from 'react';
import { Check } from './Icons';

const TwitterIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const Footer = ({ onNavigate, onStart, onDocs, onPrivacy, onTerms }) => {
  const handleNavigate = (page) => {
    window.scrollTo(0, 0);
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <footer className="bg-white border-t border-zinc-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-20">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-white border-2 border-black rounded-sm flex items-center justify-center">
                <Check strokeWidth={3} className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold text-lg tracking-tight">GradeMind.ai</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
              Empowering educators with AI-driven grading tools. Accurate, fast, and fair assessment for the modern classroom.
            </p>
          </div>

          <div className="col-span-1">
            <h4 className="font-bold text-zinc-900 mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><button onClick={() => { window.scrollTo(0, 0); if (onStart) onStart(); }} className="hover:text-zinc-900 transition-colors">Pricing</button></li>
              <li><button onClick={() => { window.scrollTo(0, 0); if (onDocs) onDocs(); }} className="hover:text-zinc-900 transition-colors">Documentation</button></li>
              <li><button onClick={() => handleNavigate('api')} className="hover:text-zinc-900 transition-colors">API</button></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="font-bold text-zinc-900 mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><button onClick={() => handleNavigate('about')} className="hover:text-zinc-900 transition-colors">About</button></li>
              <li><button onClick={() => handleNavigate('blog')} className="hover:text-zinc-900 transition-colors">Blog</button></li>
              <li><button onClick={() => handleNavigate('contact')} className="hover:text-zinc-900 transition-colors">Contact</button></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="font-bold text-zinc-900 mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><button onClick={() => { window.scrollTo(0, 0); if (onPrivacy) onPrivacy(); }} className="hover:text-zinc-900 transition-colors">Privacy</button></li>
              <li><button onClick={() => { window.scrollTo(0, 0); if (onTerms) onTerms(); }} className="hover:text-zinc-900 transition-colors">Terms</button></li>
              <li><button onClick={() => handleNavigate('security')} className="hover:text-zinc-900 transition-colors">Security</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-8 flex justify-center items-center">
          <div className="text-xs text-zinc-400">
            © 2025 GradeMind AI Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

