import React from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, Lock, Eye, Server, AlertTriangle, Users } from './Icons';
import Footer from './Footer';

const Security = ({ onBack, onNavigate, onStart, onDocs, onPrivacy, onTerms }) => {
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
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto bg-zinc-900 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
              <Shield className="w-16 h-16 text-white" strokeWidth={1.5} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-zinc-900 mb-6"
          >
            Security & Compliance
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-zinc-600 leading-relaxed"
          >
            We take the security of your data seriously. Learn about our comprehensive security measures and compliance standards.
          </motion.p>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-zinc-900 mb-12 text-center">Our Security Measures</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">End-to-End Encryption</h3>
              <p className="text-zinc-600 leading-relaxed">
                All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption standards.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                <Server className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Secure Infrastructure</h3>
              <p className="text-zinc-600 leading-relaxed">
                Hosted on enterprise-grade cloud infrastructure with 99.9% uptime SLA and automatic backups.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                <Eye className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Privacy by Design</h3>
              <p className="text-zinc-600 leading-relaxed">
                Student data is isolated per workspace and never used for AI model training without explicit consent.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Access Controls</h3>
              <p className="text-zinc-600 leading-relaxed">
                Role-based access control (RBAC) ensures only authorized users can access sensitive data.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Security Monitoring</h3>
              <p className="text-zinc-600 leading-relaxed">
                24/7 security monitoring and intrusion detection systems to identify and respond to threats.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Regular Audits</h3>
              <p className="text-zinc-600 leading-relaxed">
                Annual third-party security audits and penetration testing to ensure best practices.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-zinc-900 mb-12 text-center">Compliance Standards</h2>
          <div className="space-y-6">
            <div className="bg-white border-2 border-zinc-200 rounded-2xl p-6 hover:border-zinc-900 transition-colors">
              <h3 className="text-xl font-bold text-zinc-900 mb-2">FERPA Compliance</h3>
              <p className="text-zinc-600">
                Fully compliant with the Family Educational Rights and Privacy Act (FERPA) to protect student education records.
              </p>
            </div>

            <div className="bg-white border-2 border-zinc-200 rounded-2xl p-6 hover:border-zinc-900 transition-colors">
              <h3 className="text-xl font-bold text-zinc-900 mb-2">GDPR Ready</h3>
              <p className="text-zinc-600">
                Meets General Data Protection Regulation (GDPR) requirements for data processing and user rights.
              </p>
            </div>

            <div className="bg-white border-2 border-zinc-200 rounded-2xl p-6 hover:border-zinc-900 transition-colors">
              <h3 className="text-xl font-bold text-zinc-900 mb-2">SOC 2 Type II (In Progress)</h3>
              <p className="text-zinc-600">
                Currently undergoing SOC 2 Type II certification to validate our security controls and procedures.
              </p>
            </div>

            <div className="bg-white border-2 border-zinc-200 rounded-2xl p-6 hover:border-zinc-900 transition-colors">
              <h3 className="text-xl font-bold text-zinc-900 mb-2">COPPA Compliant</h3>
              <p className="text-zinc-600">
                Adheres to Children's Online Privacy Protection Act (COPPA) standards for protecting children's privacy online.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Handling Section */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-zinc-900 mb-8 text-center">How We Handle Your Data</h2>
          <div className="space-y-6 text-lg text-zinc-600 leading-relaxed">
            <div className="bg-white border-2 border-zinc-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Data Collection</h3>
              <p>
                We only collect data necessary to provide our services. This includes assignment content, student submissions, and grading results. We never collect unnecessary personal information.
              </p>
            </div>

            <div className="bg-white border-2 border-zinc-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Data Storage</h3>
              <p>
                All data is stored in secure, encrypted databases with regular backups. Student submissions are automatically deleted after 90 days unless you choose to retain them longer.
              </p>
            </div>

            <div className="bg-white border-2 border-zinc-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Data Usage</h3>
              <p>
                Student data is never used for AI model training. We only process submissions to provide grading services. You maintain full ownership of all your data.
              </p>
            </div>

            <div className="bg-white border-2 border-zinc-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Data Deletion</h3>
              <p>
                You can delete your data at any time. Upon request, we will permanently delete all your data within 30 days and provide confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Best Practices */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-zinc-900 mb-8 text-center">Security Best Practices for Users</h2>
          <div className="bg-white border-2 border-zinc-200 rounded-3xl p-8 space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">Use Strong Passwords</h3>
                <p className="text-zinc-600">Create unique, complex passwords and enable two-factor authentication.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">Review Access Permissions</h3>
                <p className="text-zinc-600">Regularly audit who has access to your workspaces and revoke unnecessary permissions.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">Keep Software Updated</h3>
                <p className="text-zinc-600">Always use the latest version of your browser and enable automatic updates.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">Report Suspicious Activity</h3>
                <p className="text-zinc-600">If you notice any unusual activity, contact our security team immediately.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-zinc-900 mb-6">Security Concerns?</h2>
          <p className="text-xl text-zinc-600 mb-8">
            If you have any security concerns or questions, our security team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:security@grademind.ai"
              className="px-8 py-4 bg-zinc-900 text-white rounded-full font-bold text-lg hover:bg-black transition-all hover:scale-105"
            >
              Contact Security Team
            </a>
            <button
              onClick={() => handleNavigate('contact')}
              className="px-8 py-4 bg-white text-zinc-900 border-2 border-zinc-200 rounded-full font-bold text-lg hover:border-zinc-900 hover:bg-zinc-50 transition-all"
            >
              General Contact
            </button>
          </div>
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

export default Security;

