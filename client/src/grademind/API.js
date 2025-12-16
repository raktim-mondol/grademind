import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Code, Terminal, BookOpen } from './Icons';
import Footer from './Footer';

const API = ({ onBack, onNavigate, onStart, onDocs, onPrivacy, onTerms }) => {
  const handleBack = () => {
    window.scrollTo(0, 0);
    onBack();
  };

  const handleNavigate = (page) => {
    window.scrollTo(0, 0);
    onNavigate(page);
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-zinc-900 selection:text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleBack}>
            <div className="w-6 h-6 bg-white border-2 border-black rounded-sm flex items-center justify-center">
              <Check className="w-4 h-4 text-black" strokeWidth={3} />
            </div>
            <span className="font-bold text-lg tracking-tight text-zinc-900">GradeMind.ai</span>
          </div>
          <button onClick={handleBack} className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 min-h-[80vh] flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto bg-zinc-900 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
              <Code className="w-16 h-16 text-white" strokeWidth={1.5} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-zinc-900 mb-6"
          >
            API Coming Soon
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-zinc-600 leading-relaxed mb-12"
          >
            We're building a powerful API to integrate GradeMind's AI grading capabilities directly into your applications.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => {
                const email = prompt('Enter your email to get notified when the API launches:');
                if (email) {
                  alert('Thank you! We\'ll notify you at ' + email + ' when the API is ready.');
                }
              }}
              className="px-8 py-4 bg-zinc-900 text-white rounded-full font-bold text-lg hover:bg-black transition-all hover:scale-105 shadow-2xl"
            >
              Notify Me When Ready
            </button>
            <button
              onClick={onDocs}
              className="px-8 py-4 bg-white text-zinc-900 border-2 border-zinc-200 rounded-full font-bold text-lg hover:border-zinc-900 hover:bg-zinc-50 transition-all"
            >
              View Documentation
            </button>
          </motion.div>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-zinc-900 mb-12 text-center">What to Expect</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-xl"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                <Terminal className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">RESTful API</h3>
              <p className="text-zinc-600 leading-relaxed">
                Simple, intuitive REST endpoints with comprehensive documentation and code examples in multiple languages.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-xl"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                <Code className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">SDKs & Libraries</h3>
              <p className="text-zinc-600 leading-relaxed">
                Official SDKs for Python, JavaScript, Ruby, and more. Get started in minutes with your favorite language.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-xl"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Full Documentation</h3>
              <p className="text-zinc-600 leading-relaxed">
                Detailed guides, tutorials, and API references with interactive examples and use cases.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-zinc-900 mb-12 text-center">Potential Use Cases</h2>
          <div className="space-y-6">
            <div className="bg-white border-2 border-zinc-200 rounded-2xl p-6 hover:border-zinc-900 transition-colors">
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Learning Management Systems</h3>
              <p className="text-zinc-600">Integrate AI grading directly into your LMS platform for seamless assessment workflows.</p>
            </div>
            <div className="bg-white border-2 border-zinc-200 rounded-2xl p-6 hover:border-zinc-900 transition-colors">
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Educational Apps</h3>
              <p className="text-zinc-600">Build educational applications with built-in automated grading capabilities.</p>
            </div>
            <div className="bg-white border-2 border-zinc-200 rounded-2xl p-6 hover:border-zinc-900 transition-colors">
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Custom Workflows</h3>
              <p className="text-zinc-600">Create custom grading workflows tailored to your institution's specific needs.</p>
            </div>
            <div className="bg-white border-2 border-zinc-200 rounded-2xl p-6 hover:border-zinc-900 transition-colors">
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Batch Processing</h3>
              <p className="text-zinc-600">Process large volumes of submissions programmatically for enterprise-scale assessment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-zinc-900 mb-6">Development Timeline</h2>
          <p className="text-lg text-zinc-600 mb-12">
            We're actively developing the API and expect to launch in Q2 2025. Stay tuned for updates!
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white border-2 border-zinc-200 rounded-full">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            <span className="font-medium text-zinc-900">In Development</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-zinc-900 mb-6">Want Early Access?</h2>
          <p className="text-xl text-zinc-600 mb-8">
            Join our early access program to be among the first to test the API and shape its development.
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="px-8 py-4 bg-zinc-900 text-white rounded-full font-bold text-lg hover:bg-black transition-all hover:scale-105"
          >
            Request Early Access
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer 
        onNavigate={handleNavigate}
        onStart={onStart}
        onDocs={onDocs}
        onPrivacy={onPrivacy}
        onTerms={onTerms}
      />
    </div>
  );
};

export default API;

