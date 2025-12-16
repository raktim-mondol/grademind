import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Mail, MessageSquare, HelpCircle } from './Icons';
import Footer from './Footer';

const Contact = ({ onBack, onNavigate, onStart, onDocs, onPrivacy, onTerms }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleBack = () => {
    window.scrollTo(0, 0);
    onBack();
  };

  const handleNavigateToPage = (page) => {
    window.scrollTo(0, 0);
    onNavigate(page);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you within 24 hours.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-zinc-900 mb-6"
          >
            Get in Touch
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-zinc-600 leading-relaxed"
          >
            Have questions? We're here to help. Reach out and we'll respond within 24 hours.
          </motion.p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 text-center shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Mail className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Email Support</h3>
              <p className="text-zinc-600 mb-4">Get help via email</p>
              <a href="mailto:support@grademind.ai" className="text-zinc-900 font-medium hover:underline">
                support@grademind.ai
              </a>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 text-center shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <MessageSquare className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Live Chat</h3>
              <p className="text-zinc-600 mb-4">Chat with our team</p>
              <button className="text-zinc-900 font-medium hover:underline">
                Start Chat
              </button>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 text-center shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <HelpCircle className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Help Center</h3>
              <p className="text-zinc-600 mb-4">Browse documentation</p>
              <button className="text-zinc-900 font-medium hover:underline">
                View Docs
              </button>
            </motion.div>
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border-2 border-zinc-200 rounded-3xl p-8 md:p-12 shadow-2xl">
              <h2 className="text-3xl font-bold text-zinc-900 mb-8 text-center">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-zinc-900 focus:outline-none transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-zinc-900 focus:outline-none transition-colors"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-zinc-900 focus:outline-none transition-colors"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-zinc-900 focus:outline-none transition-colors resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-zinc-900 text-white rounded-full font-bold text-lg hover:bg-black transition-all hover:scale-105"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Office Section */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-zinc-900 mb-6">Our Office</h2>
          <p className="text-lg text-zinc-600 mb-4">
            123 Education Drive, Suite 400<br />
            San Francisco, CA 94102<br />
            United States
          </p>
          <p className="text-zinc-600">
            Monday - Friday: 9:00 AM - 6:00 PM PST
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer 
        onNavigate={handleNavigateToPage}
        onStart={onStart}
        onDocs={onDocs}
        onPrivacy={onPrivacy}
        onTerms={onTerms}
      />
    </div>
  );
};

export default Contact;

