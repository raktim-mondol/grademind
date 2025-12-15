import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, ArrowRight, FileText, Sparkles, CheckCircle, Loader2,
  Brain, Target, Gauge, PieChart, Users, Shield, Zap, Menu, X, ChevronRight
} from './Icons';

// --- Components ---

const Navbar = ({ onStart, onLogin, onDocs, onPrivacy, onTerms }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-zinc-100 py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-6 h-6 bg-white border-2 border-black rounded-sm flex items-center justify-center">
            <Check className="w-4 h-4 text-black" strokeWidth={3} />
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900">GradeMind.ai</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6 text-sm font-medium text-zinc-500">
            <button onClick={onStart} className="hover:text-zinc-900 transition-colors">Pricing</button>
            <button onClick={onDocs} className="hover:text-zinc-900 transition-colors">Docs</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="text-sm font-medium text-zinc-900 hover:text-zinc-700 transition-colors px-3 py-2">
              Log in
            </button>
            <button
              onClick={onStart}
              className="text-sm font-medium bg-zinc-900 text-white px-5 py-2.5 rounded-full hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-zinc-200"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 text-zinc-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-zinc-100 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              <button onClick={() => { onStart(); setMobileMenuOpen(false); }} className="text-left font-medium text-zinc-600 py-2">Pricing</button>
              <button onClick={() => { onDocs(); setMobileMenuOpen(false); }} className="text-left font-medium text-zinc-600 py-2">Documentation</button>
              <hr className="border-zinc-100" />
              <button onClick={() => { onLogin(); setMobileMenuOpen(false); }} className="text-left font-medium text-zinc-900 py-2">Log in</button>
              <button onClick={() => { onStart(); setMobileMenuOpen(false); }} className="bg-zinc-900 text-white py-3 rounded-lg font-medium text-center">Get Started</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const GradingAnimation = () => {
  const [phase, setPhase] = useState(0);
  const [processText, setProcessText] = useState("Initializing...");
  const [assignmentIndex, setAssignmentIndex] = useState(0);

  const assignments = [
    {
      filename: "CS229_RL_Theory_Sarah_Chen.pdf",
      title: "Deep Reinforcement Learning Theory - Sarah Chen",
      student: "Sarah Chen",
      content: "Abstract: This paper explores the convergence properties of Q-learning in continuous state spaces. detailed analysis of the exploration-exploitation dilemma suggests that epsilon-greedy strategies, while simple, often fail in high-dimensional environments due to the curse of dimensionality. We propose a novel entropy-regularized policy gradient method that balances sample efficiency with asymptotic optimality. By introducing a dynamic temperature parameter, our agent demonstrates superior performance on the MuJoCo benchmark suite compared to standard PPO baselines.\n\nFurthermore, we provide a theoretical bound on the regret, showing that it scales logarithmically with the number of training episodes under mild assumptions about the reward function's smoothness. The integration of these techniques opens new avenues for robotic control tasks where sample efficiency is paramount. Our experiments verify that the proposed method not only converges faster but also finds policies with higher expected returns. In Section 4, we discuss the implications of these findings for real-world robotics.\n\nThe scalability of this approach is tested on a variety of continuous control tasks, ranging from simple pendulum balancing to complex humanoid locomotion. Results indicate a 20% improvement in sample efficiency over state-of-the-art methods. Future work will focus on extending this framework to multi-agent settings.",
      grade: "B+",
      score: "85/100",
      feedback: "Strong grasp of fundamental RL concepts. Your explanation of the exploration-exploitation tradeoff is well-articulated. However, the proof for the regret bound relies on unstated assumptions."
    },
    {
      filename: "HIST305_Cold_War_Marcus_Johnson.pdf",
      title: "Proxy Wars in the Cold War - Marcus Johnson",
      student: "Marcus Johnson",
      content: "Introduction: The Cold War era was defined not by direct military confrontation between the superpowers, but by a series of proxy conflicts that devastated the Global South. This essay argues that the ideological rigidity of both the Truman Doctrine and the Brezhnev Doctrine blinded policymakers to local nationalist movements, misinterpreting them as mere pawns in a global chess game. Focusing on the conflicts in Angola and Vietnam, we demonstrate how local socio-political dynamics were far more instrumental in driving outcomes than the intervention of Washington or Moscow.\n\nThe failure to recognize this nuance prolonged conflicts unnecessarily and resulted in catastrophic loss of life. By re-examining declassified cables from the era, we can see a pattern of miscommunication and cultural ignorance that exacerbated tensions. Specifically, the US involvement in Vietnam was predicated on the Domino Theory, which failed to account for the deep-seated historical animosity between Vietnam and China. Similarly, Soviet intervention in Afghanistan ignored tribal loyalties.\n\nThis paper will proceed by analyzing three key case studies: the Angolan Civil War, the Vietnam War, and the Soviet-Afghan War. In each case, we will highlight how local agency was underestimated by the superpowers.",
      grade: "A",
      score: "95/100",
      feedback: "Outstanding historical analysis. You effectively challenge the traditional bipolar framework by centering local agency. The use of primary sources adds significant weight to your argument."
    },
    {
      filename: "MED401_Diabetes_Case_Emily_Rodriguez.pdf",
      title: "Type 2 Diabetes Case Analysis - Emily Rodriguez",
      student: "Emily Rodriguez",
      content: "Patient History: A 52-year-old Hispanic male presents with polydipsia (excessive thirst), polyuria (frequent urination), and unexplained weight loss of 15 lbs over 3 months. Family history is significant for T2DM in both parents. Vitals: BP 145/90, HR 88, BMI 31.2. Lab Results: Fasting Plasma Glucose 186 mg/dL, HbA1c 8.9%, Lipid Panel indicates elevated LDL and triglycerides.\n\nDiagnosis: Creating a differential diagnosis, we must rule out Type 1 Diabetes, considering the patient's age and BMI, though LADA is a remote possibility. The clinical presentation strongly supports Type 2 Diabetes Mellitus complicated by early-stage hypertension. Treatment Plan: Immediate lifestyle intervention focusing on dietary changes and aerobic activity. Pharmacological intervention should begin with Metformin 500mg BID, titrated up as tolerated.\n\nMonitoring and Follow-up: The patient should return in 3 months for a repeat HbA1c and checking renal function. We will also refer the patient to a nutritionist and a podiatrist for a diabetic foot exam. Screening for retinopathy is also indicated.",
      grade: "A-",
      score: "92/100",
      feedback: "Comprehensive diagnostic reasoning. You correctly correlated symptoms with lab values to support your T2DM diagnosis. Good foresight on LADA, but be specific about ACE inhibitor thresholds."
    }
  ];

  useEffect(() => {
    let mounted = true;
    const runAnimation = async () => {
      while (mounted) {
        for (let i = 0; i < assignments.length; i++) {
          if (!mounted) break;
          setAssignmentIndex(i);

          setPhase(0); // View
          await new Promise(r => setTimeout(r, 2500));
          if (!mounted) break;

          setPhase(1); // Analyze
          setProcessText("Reading content...");
          await new Promise(r => setTimeout(r, 1500));
          setProcessText("Checking rubric...");
          await new Promise(r => setTimeout(r, 1500));
          setProcessText("Analyzing structure...");
          await new Promise(r => setTimeout(r, 1500));
          setProcessText("Generating feedback...");
          await new Promise(r => setTimeout(r, 1500));
          if (!mounted) break;

          setPhase(2); // Result
          await new Promise(r => setTimeout(r, 6000));
          if (!mounted) break;
        }
      }
    };
    runAnimation();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="relative w-full max-w-3xl mx-auto perspective-1000">
      <motion.div
        key={assignmentIndex}
        initial={{ rotateX: 5, y: 20, opacity: 0 }}
        animate={{ rotateX: 0, y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-2xl shadow-zinc-200/50 border border-zinc-200 overflow-hidden relative"
      >
        {/* Header - Windows PDF Viewer Style */}
        <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-md border border-zinc-200 shadow-sm">
              <FileText className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-medium text-zinc-600 tracking-tight">{assignments[assignmentIndex].filename}</span>
            </div>
          </div>

          {/* Windows Controls */}
          <div className="flex items-center gap-4">
            <div className="w-3 h-[1px] bg-zinc-400"></div> {/* Minimize */}
            <div className="w-2.5 h-2.5 border border-zinc-400"></div> {/* Maximize */}
            <X className="w-3.5 h-3.5 text-zinc-500" /> {/* Close */}
          </div>
        </div>

        {/* Content Area - A4 Paper Look */}
        {/* Content Area - A4 Paper Look */}
        <div className="p-8 relative h-[525px] bg-white">
          <div className={`transition-all duration-500 max-w-2xl mx-auto space-y-6 ${phase === 2 ? 'blur-sm opacity-60' : ''}`}>
            {/* Document Heading */}
            <div className="border-b border-zinc-100 pb-4">
              <h4 className="font-serif text-2xl font-bold text-zinc-900 mb-1">{assignments[assignmentIndex].title}</h4>
              <p className="text-sm text-zinc-500">Submitted by {assignments[assignmentIndex].student} • Oct 12, 2024</p>
            </div>

            {/* Document Body */}
            <div className="prose prose-sm max-w-none">
              <p className="font-serif text-base leading-relaxed text-zinc-800 whitespace-pre-wrap">
                {assignments[assignmentIndex].content}
              </p>
            </div>
          </div>

          {/* AI Scanning Effect - Overlay but text visible */}
          <AnimatePresence>
            {phase === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
              >
                {/* Moving Scanner Line */}
                <motion.div
                  initial={{ top: 0 }}
                  animate={{ top: "100%" }}
                  transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                  className="absolute left-0 right-0 h-2 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80 shadow-[0_0_40px_rgba(59,130,246,0.5)] z-20 blur-[1px] rounded-[50%]"
                />

                {/* Highlight/Analyze Box - Centered */}
                <motion.div
                  className="bg-zinc-900/90 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-3 backdrop-blur-md border border-white/10 z-30"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span className="text-sm font-medium tracking-wide font-mono">{processText}</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result Overlay - Centered with blurred background */}
          <AnimatePresence>
            {phase === 2 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center p-6"
              >
                <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-zinc-200/50 overflow-hidden ring-1 ring-zinc-900/5">
                  <div>
                    {/* Score Section */}
                    <div className="bg-zinc-50 border-b border-zinc-100 p-6 flex flex-col items-center justify-center text-center">
                      <div className="text-5xl font-bold text-zinc-900 tracking-tight mb-2">{assignments[assignmentIndex].grade}</div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span className="font-semibold text-zinc-900">Score:</span> {assignments[assignmentIndex].score}
                      </div>
                    </div>

                    {/* Feedback Section */}
                    <div className="p-6">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={3} />
                        </div>
                        <div>
                          <h5 className="font-semibold text-zinc-900 text-sm mb-1">Feedback Generated</h5>
                          <p className="text-sm text-zinc-600 leading-relaxed">{assignments[assignmentIndex].feedback}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Decorative elements behind */}
      <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-100/30 via-purple-100/30 to-zinc-100/30 blur-3xl rounded-full" />
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div
    className="group p-6 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 hover:bg-white hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300"
  >
    <div className="w-12 h-12 rounded-xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:border-zinc-200">
      <Icon className="w-6 h-6 text-zinc-900" strokeWidth={1.5} />
    </div>
    <h3 className="text-lg font-bold text-zinc-900 mb-2">{title}</h3>
    <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
  </div>
);

const Landing = ({ onStart, onLogin, onDocs, onPrivacy, onTerms }) => {
  const [sloganIndex, setSloganIndex] = useState(0);
  const slogans = ["in seconds.", "with precision.", "effortlessly."];

  useEffect(() => {
    const interval = setInterval(() => {
      setSloganIndex((prev) => (prev + 1) % slogans.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-zinc-900 selection:text-white overflow-hidden">
      <Navbar onStart={onStart} onLogin={onLogin} onDocs={onDocs} onPrivacy={onPrivacy} onTerms={onTerms} />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-16">

          <div className="max-w-3xl text-center flex flex-col items-center">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-full mb-8"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">AI-Powered Grading Assistant</span>
            </div>

            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-zinc-900 mb-6 leading-[1.1]"
            >
              Grading done <br />
              <AnimatePresence mode="wait">
                <motion.span
                  key={sloganIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 via-zinc-600 to-zinc-400 pb-2"
                >
                  {slogans[sloganIndex]}
                </motion.span>
              </AnimatePresence>
            </h1>

            <p
              className="text-lg sm:text-xl text-zinc-500 mb-8 leading-relaxed max-w-lg mx-auto"
            >
              Upload assignments, define your rubric, and let AI handle the heavy lifting. Precise, consistent feedback for every student, every time.
            </p>

            <div
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <button
                onClick={onStart}
                className="group px-8 py-4 bg-zinc-900 text-white rounded-full font-bold text-lg hover:bg-black transition-all hover:scale-105 shadow-xl shadow-zinc-200 flex items-center gap-2"
              >
                Start Grading Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onDocs}
                className="px-8 py-4 bg-white text-zinc-600 border border-zinc-200 rounded-full font-bold text-lg hover:bg-zinc-50 transition-colors flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Read the Docs
              </button>
            </div>

            <div
              className="mt-12 flex items-center gap-4 text-xs text-zinc-400"
            >
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center overflow-hidden">
                    <Users className="w-4 h-4 text-zinc-300" />
                  </div>
                ))}
              </div>
              <p>Trusted by forward-thinking educators</p>
            </div>
          </div>

        </div>
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-gradient-to-b from-zinc-50 to-white rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3" />
      </section>

      {/* --- GRADING DEMO SECTION --- */}
      <section className="py-24 bg-zinc-50/50 border-t border-zinc-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4">See AI Grading in Action</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">Watch how GradeMind analyzes assignments, checks rubric compliance, and delivers instant feedback.</p>
          </div>

          <GradingAnimation />
        </div>

        {/* Background decoration for demo section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-white to-transparent opacity-80 pointer-events-none" />
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">Built for speed and accuracy.</h2>
            <p className="text-lg text-zinc-500">
              GradeMind isn't just a grader; it's your teaching assistant. Designed to save you hours every week while providing better feedback to students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Target}
              title="Rubric Alignment"
              description="Define precise criteria. The AI strictly follows your rubric to ensure fair and consistent scoring across all submissions."
              delay={0.1}
            />
            <FeatureCard
              icon={Zap}
              title="Instant Turnaround"
              description="What used to take weekends now takes minutes. Upload a batch of 100 assignments and get them back before your coffee cools."
              delay={0.2}
            />
            <FeatureCard
              icon={Brain}
              title="Context Aware"
              description="Understands nuance in student answers. It doesn't just keyword match—it comprehends arguments and logic."
              delay={0.3}
            />
            <FeatureCard
              icon={PieChart}
              title="Insightful Analytics"
              description="Track class performance instantly. Identify common misconceptions and struggle areas with auto-generated reports."
              delay={0.4}
            />
            <FeatureCard
              icon={Shield}
              title="Secure & Private"
              description="Student data is processed securely. We don't train our models on your students' work without explicit permission."
              delay={0.5}
            />
            <FeatureCard
              icon={FileText}
              title="Rich Feedback"
              description="Every grade comes with detailed, constructive feedback explaining exactly why points were awarded or deducted."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden bg-zinc-900 text-white text-center py-24 px-6 md:px-20 shadow-2xl">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-8">
              Ready to reclaim <br /> your weekends?
            </h2>
            <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join thousands of educators who are saving 10+ hours a week with GradeMind. No credit card required to start.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onStart}
                className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-900 rounded-full font-bold text-lg hover:bg-zinc-100 transition-all hover:scale-105"
              >
                Get Started for Free
              </button>
              <button
                onClick={onStart}
                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-zinc-700 text-white rounded-full font-bold text-lg hover:bg-zinc-800 transition-all"
              >
                View Pricing
              </button>
            </div>
            <div className="mt-8 text-sm text-zinc-400">
              No credit card required · Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
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
              <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mb-6">
                Empowering educators with AI-driven grading tools. Accurate, fast, and fair assessment for the modern classroom.
              </p>
              <div className="flex gap-4">
                {/* Social placeholders */}
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 cursor-pointer transition-colors"><TwitterIcon /></div>
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 cursor-pointer transition-colors"><GithubIcon /></div>
              </div>
            </div>

            <div className="col-span-1">
              <h4 className="font-bold text-zinc-900 mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><button onClick={onStart} className="hover:text-zinc-900 transition-colors">Pricing</button></li>
                <li><button onClick={onDocs} className="hover:text-zinc-900 transition-colors">Documentation</button></li>
                <li><button className="hover:text-zinc-900 transition-colors">API</button></li>
                <li><button className="hover:text-zinc-900 transition-colors">Integrations</button></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h4 className="font-bold text-zinc-900 mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><button className="hover:text-zinc-900 transition-colors">About</button></li>
                <li><button className="hover:text-zinc-900 transition-colors">Blog</button></li>
                <li><button className="hover:text-zinc-900 transition-colors">Careers</button></li>
                <li><button className="hover:text-zinc-900 transition-colors">Contact</button></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h4 className="font-bold text-zinc-900 mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><button onClick={onPrivacy} className="hover:text-zinc-900 transition-colors">Privacy</button></li>
                <li><button onClick={onTerms} className="hover:text-zinc-900 transition-colors">Terms</button></li>
                <li><button className="hover:text-zinc-900 transition-colors">Security</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-zinc-400">
              © 2025 GradeMind AI Inc. All rights reserved.
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                All Systems Operational
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div >
  );
};

// Simple Icon Components for Footer
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

export default Landing;
