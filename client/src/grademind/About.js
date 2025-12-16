import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Target, Users, Sparkles, Heart } from './Icons';
import Footer from './Footer';

const About = ({ onBack, onNavigate, onStart, onDocs, onPrivacy, onTerms }) => {
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
            About GradeMind
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-zinc-600 leading-relaxed"
          >
            We're on a mission to give educators their time back while maintaining the highest standards of grading quality.
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-zinc-900 mb-6">Our Mission</h2>
              <p className="text-lg text-zinc-600 leading-relaxed mb-4">
                Every week, educators spend countless hours grading assignments, essays, and exams. This time could be better spent mentoring students, developing curriculum, or simply achieving work-life balance.
              </p>
              <p className="text-lg text-zinc-600 leading-relaxed mb-4">
                GradeMind was built to solve this problem. We combine advanced AI technology with deep understanding of educational assessment to deliver consistent, fair, and detailed grading at scale.
              </p>
              <p className="text-lg text-zinc-600 leading-relaxed">
                Our goal is simple: help educators save 10+ hours per week without compromising on quality or fairness.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square bg-zinc-900 rounded-3xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
                <Target className="w-32 h-32 text-white relative z-10" strokeWidth={1} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-zinc-900 mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Accuracy First</h3>
              <p className="text-zinc-600 leading-relaxed">
                We never compromise on grading quality. Our AI is trained to match expert educator standards and follows rubrics religiously.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Educator-Centric</h3>
              <p className="text-zinc-600 leading-relaxed">
                Built by educators, for educators. Every feature is designed with real classroom needs in mind, not just technology for its own sake.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Student Success</h3>
              <p className="text-zinc-600 leading-relaxed">
                When educators have more time, students benefit. Better feedback, more engagement, improved learning outcomes.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-zinc-900 mb-8 text-center">Our Story</h2>
          <div className="space-y-6 text-lg text-zinc-600 leading-relaxed">
            <p>
              GradeMind was founded in 2024 by a team of educators and AI engineers who experienced firsthand the grading burden in modern education. After spending countless weekends grading hundreds of assignments, we knew there had to be a better way.
            </p>
            <p>
              We started with a simple question: What if AI could handle the repetitive aspects of grading while maintaining the consistency and fairness that students deserve? After months of research and development, working closely with educators across various disciplines, we built GradeMind.
            </p>
            <p>
              Today, GradeMind helps thousands of educators save 10+ hours per week, allowing them to focus on what really matters: inspiring students, developing innovative curriculum, and maintaining a healthy work-life balance.
            </p>
            <p>
              We're just getting started. Our vision is to become the trusted grading assistant for every educator worldwide, continuously improving through feedback from our community and advances in AI technology.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-zinc-900 mb-2">10,000+</div>
              <div className="text-zinc-600">Educators</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-zinc-900 mb-2">1M+</div>
              <div className="text-zinc-600">Assignments Graded</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-zinc-900 mb-2">100k+</div>
              <div className="text-zinc-600">Hours Saved</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-zinc-900 mb-2">98%</div>
              <div className="text-zinc-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-zinc-900 mb-6">Join Our Mission</h2>
          <p className="text-xl text-zinc-600 mb-8">
            Be part of the movement to transform education through intelligent automation.
          </p>
          <button
            onClick={onBack}
            className="px-8 py-4 bg-zinc-900 text-white rounded-full font-bold text-lg hover:bg-black transition-all hover:scale-105"
          >
            Get Started Today
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

export default About;

