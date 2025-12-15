import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Upload, FileText, X, CheckCircle, LayoutGrid, Code, Terminal, BookOpen } from './Icons';

const ProjectSetupForm = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    title: '',
    description: '',
    totalPoints: 100,
    projectType: 'coding_assignment',
    programmingLanguage: 'python',
    rubric: '',
    rubricFile: undefined
  });

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      setConfig(prev => ({
        ...prev,
        [field]: {
          mimeType: file.type,
          data: base64String,
          name: file.name
        }
      }));
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const removeFile = (field) => {
    setConfig(prev => ({ ...prev, [field]: undefined }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else onComplete(config);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onCancel();
  };

  const isStepValid = () => {
    if (step === 1) return config.title.trim().length > 0 && config.description.trim().length > 0;
    if (step === 2) return true;
    if (step === 3) return true;
    return true;
  };

  const projectTypes = [
    { id: 'coding_assignment', label: 'Coding Assignment', icon: Code, desc: 'Evaluate code correctness and style.' },
    { id: 'project_report', label: 'Project Report', icon: BookOpen, desc: 'Grade written reports and documentation.' },
    { id: 'data_analysis', label: 'Data Analysis', icon: Terminal, desc: 'Assess data processing and insights.' }
  ];

  const languages = [
    { id: 'python', label: 'Python' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'java', label: 'Java' },
    { id: 'cpp', label: 'C++' },
    { id: 'other', label: 'Other' }
  ];

  const FileUploader = ({ field, currentFile, label }) => (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</label>
      </div>
      {currentFile ? (
        <div className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-200 rounded flex items-center justify-center">
              <FileText className="w-3 h-3 text-zinc-600" />
            </div>
            <span className="text-xs font-medium text-zinc-900">{currentFile.name}</span>
          </div>
          <button onClick={() => removeFile(field)} className="p-1.5 hover:bg-zinc-200 rounded-full text-zinc-500 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label className="cursor-pointer group flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-all">
          <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-zinc-600">
            <Upload className="w-3 h-3" />
            <span className="text-xs font-medium">Upload File</span>
          </div>
          <input type="file" className="hidden" accept=".pdf,.txt" onChange={(e) => handleFileChange(field, e)} />
        </label>
      )}
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full py-5 px-6 flex flex-col h-full">
        <div className="flex-shrink-0 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-zinc-500 text-xs">Step {step} of 4</p>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="relative mb-6">
            <div className="flex items-center justify-between mb-2 relative z-10">
              {[
                { num: 1, label: 'Details' },
                { num: 2, label: 'Config' },
                { num: 3, label: 'Rubric' },
                { num: 4, label: 'Review' }
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${step === s.num ? 'bg-zinc-900 text-white shadow-md scale-110' :
                    step > s.num ? 'bg-zinc-900 text-white' :
                      'bg-zinc-100 text-zinc-400'
                    }`}>
                    {step > s.num ? <CheckCircle className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300 ${step >= s.num ? 'text-zinc-900' : 'text-zinc-400'
                    }`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute top-3.5 left-[12.5%] right-[12.5%] h-0.5 bg-zinc-100 -z-0">
              <div
                className="h-full bg-zinc-900 transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Project Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-300"
                  placeholder="e.g. Final Year Capstone"
                  autoFocus
                />
              </div>

              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <label className="text-xs font-semibold text-zinc-700">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={config.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full flex-1 bg-white border border-zinc-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all resize-none placeholder:text-zinc-300 leading-relaxed overflow-y-auto min-h-[200px]"
                  placeholder="Describe the project requirements..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Project Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {projectTypes.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => handleChange('projectType', type.id)}
                      className={`cursor-pointer p-3 rounded-lg border transition-all duration-300 flex items-center gap-3 ${config.projectType === type.id
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-md'
                        : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-400'
                        }`}
                    >
                      <div className={`p-2 rounded-md ${config.projectType === type.id ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                        <type.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs">{type.label}</h3>
                        <p className={`text-[10px] ${config.projectType === type.id ? 'text-zinc-400' : 'text-zinc-500'}`}>{type.desc}</p>
                      </div>
                      {config.projectType === type.id && <CheckCircle className="w-4 h-4 ml-auto text-white" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Language</label>
                  <select
                    value={config.programmingLanguage}
                    onChange={(e) => handleChange('programmingLanguage', e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                  >
                    {languages.map(l => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Total Points</label>
                  <input
                    type="number"
                    value={config.totalPoints}
                    onChange={(e) => handleChange('totalPoints', parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                    min="1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Rubric */}
          {step === 3 && (
            <div className="space-y-3 animate-in fade-in duration-300 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Rubric</label>
                  <p className="text-xs text-zinc-500">Evaluation criteria</p>
                </div>
                <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-mono">Optional</span>
              </div>

              <textarea
                value={config.rubric}
                onChange={(e) => handleChange('rubric', e.target.value)}
                className="w-full flex-1 bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-mono text-zinc-800 focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none placeholder:text-zinc-400 overflow-y-auto min-h-[200px]"
                placeholder="1. Code Quality (20pts): ..."
                autoFocus
              />
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-zinc-100"></div>
                <span className="flex-shrink-0 mx-3 text-[10px] text-zinc-400 font-mono">OR</span>
                <div className="flex-grow border-t border-zinc-100"></div>
              </div>
              <FileUploader field="rubricFile" currentFile={config.rubricFile} label="Upload Rubric" />
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="animate-in fade-in duration-300 overflow-y-auto pr-1">
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-zinc-900 p-1.5 rounded-md">
                    <LayoutGrid className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">Summary</h3>
                    <p className="text-[10px] text-zinc-500">Review configuration</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Title</h4>
                      <div className="text-sm font-medium text-zinc-900 truncate">{config.title}</div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Points</h4>
                      <div className="text-sm font-medium text-zinc-900">{config.totalPoints}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Type</h4>
                      <div className="text-sm font-medium text-zinc-900 capitalize">{config.projectType.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Language</h4>
                      <div className="text-sm font-medium text-zinc-900 capitalize">{config.programmingLanguage}</div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white border border-zinc-200 rounded-lg">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Rubric</h4>
                    <div className="flex items-center gap-1.5">
                      {config.rubricFile ? <FileText className="w-3 h-3 text-zinc-500" /> : <FileText className="w-3 h-3 text-zinc-500" />}
                      <span className="text-xs text-zinc-600 truncate">
                        {config.rubricFile ? 'PDF Uploaded' : (config.rubric ? 'Text Provided' : 'None')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t border-zinc-100 mt-3">
          <button onClick={handleBack} className="text-zinc-600 hover:text-zinc-900 font-semibold px-4 py-2 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 group text-xs">
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className={`flex items-center gap-1.5 px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 group text-xs ${isStepValid()
              ? 'bg-gradient-to-r from-zinc-900 to-zinc-800 text-white hover:shadow-lg hover:scale-105 shadow-md'
              : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              }`}
          >
            {step === 4 ? 'Create Project' : 'Continue'}
            <ChevronRight className={`w-3 h-3 ${isStepValid() ? 'group-hover:translate-x-1' : ''} transition-transform`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSetupForm;
