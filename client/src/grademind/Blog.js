import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Calendar, Clock, ArrowRight } from './Icons';
import Footer from './Footer';

const blogPosts = [
  {
    id: 1,
    title: "The Future of AI in Education: Beyond Automated Grading",
    excerpt: "Exploring how artificial intelligence is transforming not just grading, but the entire educational experience for students and educators alike.",
    date: "December 15, 2024",
    readTime: "5 min read",
    category: "AI & Education"
  },
  {
    id: 2,
    title: "How GradeMind Saves Educators 10+ Hours Per Week",
    excerpt: "A deep dive into the time-saving mechanisms of AI-powered grading and how educators are reclaiming their weekends.",
    date: "December 10, 2024",
    readTime: "4 min read",
    category: "Case Studies"
  },
  {
    id: 3,
    title: "Maintaining Fairness and Consistency in AI Grading",
    excerpt: "How we ensure every student receives fair, unbiased evaluation regardless of when their assignment is graded or who grades it.",
    date: "December 5, 2024",
    readTime: "6 min read",
    category: "Technology"
  },
  {
    id: 4,
    title: "Best Practices for Creating Effective Rubrics",
    excerpt: "Learn how to design rubrics that work seamlessly with AI grading while maintaining pedagogical integrity.",
    date: "November 28, 2024",
    readTime: "7 min read",
    category: "Best Practices"
  },
  {
    id: 5,
    title: "Teacher Testimonials: Real Stories from the Classroom",
    excerpt: "Hear from educators across the country about how GradeMind has transformed their teaching workflow and work-life balance.",
    date: "November 20, 2024",
    readTime: "5 min read",
    category: "Success Stories"
  },
  {
    id: 6,
    title: "Understanding Context-Aware Grading Technology",
    excerpt: "How our AI goes beyond keyword matching to truly understand student responses and evaluate critical thinking.",
    date: "November 15, 2024",
    readTime: "8 min read",
    category: "Technology"
  }
];

const Blog = ({ onBack, onNavigate, onStart, onDocs, onPrivacy, onTerms }) => {
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
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-zinc-900 mb-6"
          >
            GradeMind Blog
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-zinc-600 leading-relaxed"
          >
            Insights, stories, and best practices for modern educators leveraging AI in the classroom.
          </motion.p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
                  <span className="px-3 py-1 bg-zinc-100 rounded-full text-xs font-medium text-zinc-900">
                    {post.category}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-zinc-900 mb-4 group-hover:text-zinc-700 transition-colors">
                  {post.title}
                </h2>

                <p className="text-zinc-600 leading-relaxed mb-6">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between text-sm text-zinc-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <button className="flex items-center gap-2 text-zinc-900 font-medium group-hover:gap-3 transition-all">
                  Read More
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-zinc-900 mb-6">Stay Updated</h2>
          <p className="text-lg text-zinc-600 mb-8">
            Subscribe to our newsletter for the latest insights, tips, and updates on AI in education.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 border-2 border-zinc-200 rounded-full focus:border-zinc-900 focus:outline-none transition-colors"
            />
            <button className="px-8 py-4 bg-zinc-900 text-white rounded-full font-bold hover:bg-black transition-all hover:scale-105">
              Subscribe
            </button>
          </div>
          <p className="text-sm text-zinc-500 mt-4">
            No spam. Unsubscribe anytime. We respect your privacy.
          </p>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-zinc-900 mb-8 text-center">Browse by Category</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['AI & Education', 'Best Practices', 'Case Studies', 'Technology', 'Success Stories', 'Product Updates'].map((category) => (
              <button
                key={category}
                className="px-6 py-3 bg-white border-2 border-zinc-200 rounded-full font-medium text-zinc-900 hover:border-zinc-900 hover:bg-zinc-50 transition-all"
              >
                {category}
              </button>
            ))}
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

export default Blog;

