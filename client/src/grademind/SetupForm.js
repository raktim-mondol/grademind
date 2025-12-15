import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Upload, FileText, X, CheckCircle, Cpu, Zap, Sparkles, ToggleLeft, ToggleRight, LayoutGrid } from './Icons';

const SetupForm = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    title: '',
    description: '',
    totalScore: 100,
    assignmentText: '',
    rubric: '',
    solution: '',
    selectedModels: ['gemini-2.5-pro'],
    useAverageGrading: false
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

  const toggleModel = (modelId) => {
    setConfig(prev => {
      const current = prev.selectedModels || [];
      let newModels;
      if (current.includes(modelId)) {
        newModels = current.filter(m => m !== modelId);
        if (newModels.length === 0) newModels = ['gemini-2.5-pro'];
      } else {
        newModels = [...current, modelId];
      }

      return {
        ...prev,
        selectedModels: newModels,
        useAverageGrading: newModels.length > 1 ? prev.useAverageGrading : false
      };
    });
  };

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
    else onComplete(config);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onCancel();
  };

  const isStepValid = () => {
    if (step === 1) return config.title.trim().length > 0 && config.description.trim().length > 0;
    if (step === 2) return !!config.assignmentFile || config.assignmentText.trim().length > 0;
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) return config.selectedModels.length > 0;
    return true;
  };

  const availableModels = [
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      desc: 'Most capable. Best for complex grading.',
      icon: <Sparkles className="w-3 h-3 text-purple-500" />
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      desc: 'Fast and balanced. Best for essays.',
      icon: <Zap className="w-3 h-3 text-yellow-500" />
    },
    {
      id: 'gemini-flash-lite-latest',
      name: 'Gemini Flash Lite',
      desc: 'Lightweight. Best for simple checks.',
      icon: <Cpu className="w-3 h-3 text-blue-500" />
    }
  ];

  const PDFUploader = ({ field, currentFile, label, required = false }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          handleFileChange(field, { target: { files: [file] } });
        }
      }
    };

    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        </div>
        {currentFile ? (
          <div className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-zinc-200 rounded flex items-center justify-center">
                <FileText className="w-3 h-3 text-zinc-600" />
              </div>
              <span className="text-sm font-medium text-zinc-900">{currentFile.name}</span>
            </div>
            <button onClick={() => removeFile(field)} className="p-1.5 hover:bg-zinc-200 rounded-full text-zinc-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <label
            className={`cursor-pointer group flex flex-col items-center justify-center w-full flex-1 border-2 border-dashed rounded-lg transition-all ${
              isDragging
                ? 'bg-zinc-100 border-zinc-900 border-solid'
                : 'border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={`flex flex-col items-center gap-2 transition-colors ${
              isDragging ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600'
            }`}>
              <Upload className={`w-6 h-6 ${isDragging ? 'animate-bounce' : ''}`} />
              <span className="text-base font-medium">Drag & drop PDF here</span>
              <span className="text-sm text-zinc-400">or click to browse</span>
            </div>
            <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileChange(field, e)} />
          </label>
        )}
      </div>
    );
  };

  const FileUploader = ({ field, currentFile, label }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf') || file.name.endsWith('.txt')) {
          handleFileChange(field, { target: { files: [file] } });
        }
      }
    };

    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</label>
        </div>
        {currentFile ? (
          <div className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-zinc-200 rounded flex items-center justify-center">
                <FileText className="w-3 h-3 text-zinc-600" />
              </div>
              <span className="text-sm font-medium text-zinc-900">{currentFile.name}</span>
            </div>
            <button onClick={() => removeFile(field)} className="p-1.5 hover:bg-zinc-200 rounded-full text-zinc-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <label
            className={`cursor-pointer group flex flex-col items-center justify-center w-full flex-1 border-2 border-dashed rounded-lg transition-all ${
              isDragging
                ? 'bg-zinc-100 border-zinc-900 border-solid'
                : 'border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={`flex flex-col items-center gap-2 transition-colors ${
              isDragging ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600'
            }`}>
              <Upload className={`w-6 h-6 ${isDragging ? 'animate-bounce' : ''}`} />
              <span className="text-base font-medium">Drag & drop file here</span>
              <span className="text-sm text-zinc-400">or click to browse</span>
            </div>
            <input type="file" className="hidden" accept=".pdf,.txt" onChange={(e) => handleFileChange(field, e)} />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full py-5 px-6 flex flex-col h-full">
        <div className="flex-shrink-0 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-zinc-500 text-sm">Step {step} of 6</p>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="relative mb-6">
            <div className="flex items-center justify-between mb-2 relative z-10">
              {[
                { num: 1, label: 'Details' },
                { num: 2, label: 'Content' },
                { num: 3, label: 'Rubric' },
                { num: 4, label: 'Solution' },
                { num: 5, label: 'Grading' },
                { num: 6, label: 'Review' }
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${step === s.num ? 'bg-zinc-900 text-white shadow-md scale-110' :
                    step > s.num ? 'bg-zinc-900 text-white' :
                      'bg-zinc-100 text-zinc-400'
                    }`}>
                    {step > s.num ? <CheckCircle className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${step >= s.num ? 'text-zinc-900' : 'text-zinc-400'
                    }`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute top-3.5 left-[8.33%] right-[8.33%] h-0.5 bg-zinc-100 -z-0">
              <div
                className="h-full bg-zinc-900 transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Assignment Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg p-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-300"
                  placeholder="e.g. Midterm Essay: The Great Gatsby"
                  autoFocus
                />
              </div>

              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <label className="text-sm font-semibold text-zinc-700">Instructions <span className="text-red-500">*</span></label>
                <textarea
                  value={config.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full flex-1 bg-white border border-zinc-200 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all resize-none placeholder:text-zinc-300 leading-relaxed overflow-y-auto min-h-[200px]"
                  placeholder="Provide context for the AI grader..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Assignment Content */}
          {step === 2 && (
            <div className="space-y-3 animate-in fade-in duration-300 h-full flex flex-col">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Questions <span className="text-red-500">*</span></label>
              </div>
              <div className="flex flex-col gap-3 flex-1 min-h-0">
                <div className="flex-[0.2] flex flex-col min-h-0">
                  <textarea
                    value={config.assignmentText}
                    onChange={(e) => handleChange('assignmentText', e.target.value)}
                    className="w-full h-full bg-white border border-zinc-200 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all resize-none placeholder:text-zinc-300 overflow-y-auto"
                    placeholder="Write the questions"
                    autoFocus
                  />
                </div>
                <div className="relative flex items-center justify-center py-1">
                  <div className="w-20 border-t border-zinc-100"></div>
                  <span className="flex-shrink-0 mx-3 text-xs text-zinc-400 font-mono">OR</span>
                  <div className="w-20 border-t border-zinc-100"></div>
                </div>
                <div className="flex-[0.8] flex flex-col min-h-[200px]">
                  <PDFUploader field="assignmentFile" currentFile={config.assignmentFile} label="Assignment PDF" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Rubric */}
          {step === 3 && (
            <div className="space-y-3 animate-in fade-in duration-300 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Rubric</label>
                  <span className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-mono">Optional</span>
                </div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Points</label>
              </div>

              <div className="flex items-center justify-end gap-3">
                <input
                  type="number"
                  value={config.totalScore}
                  onChange={(e) => handleChange('totalScore', parseInt(e.target.value) || 0)}
                  className="w-24 bg-white border border-zinc-200 rounded-md p-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  min="1"
                />
              </div>

              <div className="flex flex-col gap-3 flex-1 min-h-0">
                <div className="flex-[0.2] flex flex-col min-h-0">
                  <textarea
                    value={config.rubric}
                    onChange={(e) => handleChange('rubric', e.target.value)}
                    className="w-full h-full bg-white border border-zinc-200 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all resize-none placeholder:text-zinc-300 overflow-y-auto"
                    placeholder="Write your evaluation criterion"
                    autoFocus
                  />
                </div>
                <div className="relative flex items-center justify-center py-1">
                  <div className="w-20 border-t border-zinc-100"></div>
                  <span className="flex-shrink-0 mx-3 text-xs text-zinc-400 font-mono">OR</span>
                  <div className="w-20 border-t border-zinc-100"></div>
                </div>
                <div className="flex-[0.8] flex flex-col min-h-[200px]">
                  <FileUploader field="rubricFile" currentFile={config.rubricFile} label="Upload Rubric" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Solution */}
          {step === 4 && (
            <div className="space-y-3 animate-in fade-in duration-300 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Solution</label>
                  <span className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-mono">Optional</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 flex-1 min-h-0">
                <div className="flex-[0.2] flex flex-col min-h-0">
                  <textarea
                    value={config.solution}
                    onChange={(e) => handleChange('solution', e.target.value)}
                    className="w-full h-full bg-white border border-zinc-200 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all resize-none placeholder:text-zinc-300 overflow-y-auto"
                    placeholder="Write the model answer"
                    autoFocus
                  />
                </div>
                <div className="relative flex items-center justify-center py-1">
                  <div className="w-20 border-t border-zinc-100"></div>
                  <span className="flex-shrink-0 mx-3 text-xs text-zinc-400 font-mono">OR</span>
                  <div className="w-20 border-t border-zinc-100"></div>
                </div>
                <div className="flex-[0.8] flex flex-col min-h-[200px]">
                  <FileUploader field="solutionFile" currentFile={config.solutionFile} label="Upload Solution" />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: AI Config */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Select AI Models</label>
              <div className="grid grid-cols-3 gap-3">
                {availableModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => toggleModel(model.id)}
                    className={`cursor-pointer p-3 rounded-lg border transition-all duration-300 ${config.selectedModels.includes(model.id)
                      ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-900 text-white shadow-md'
                      : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-400'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-md ${config.selectedModels.includes(model.id) ? 'bg-white' : 'bg-zinc-100'}`}>
                        {model.icon}
                      </div>
                      {config.selectedModels.includes(model.id) && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <h3 className={`font-bold text-sm mb-1 ${config.selectedModels.includes(model.id) ? 'text-white' : 'text-zinc-900'}`}>{model.name}</h3>
                    <p className={`text-xs leading-relaxed ${config.selectedModels.includes(model.id) ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {model.desc}
                    </p>
                  </div>
                ))}
              </div>

              {config.selectedModels.length > 1 && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Cpu className="w-3 h-3 text-zinc-900" />
                        <h3 className="font-bold text-sm text-zinc-900">Average Grading</h3>
                      </div>
                      <p className="text-xs text-zinc-500">Average results from models</p>
                    </div>
                    <button onClick={() => handleChange('useAverageGrading', !config.useAverageGrading)} className="transition-colors">
                      {config.useAverageGrading ? (
                        <ToggleRight className="w-8 h-8 text-zinc-900" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-zinc-300" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col overflow-y-auto pr-1">
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-zinc-900 p-1.5 rounded-md">
                    <LayoutGrid className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-900">Summary</h3>
                    <p className="text-xs text-zinc-500">Review configuration</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Title</h4>
                      <div className="text-base font-medium text-zinc-900 truncate">{config.title}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Points</h4>
                      <div className="text-base font-medium text-zinc-900">{config.totalScore}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">AI Models</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {config.selectedModels.map(m => (
                        <span key={m} className="text-xs bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-600 font-mono">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-white border border-zinc-200 rounded-lg">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Questions</h4>
                      <div className="flex items-center gap-1.5">
                        {config.assignmentFile ? <FileText className="w-3 h-3 text-zinc-500" /> : <FileText className="w-3 h-3 text-zinc-500" />}
                        <span className="text-sm text-zinc-600 truncate">
                          {config.assignmentFile ? 'PDF Uploaded' : (config.assignmentText ? 'Text Provided' : 'None')}
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 bg-white border border-zinc-200 rounded-lg">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Rubric</h4>
                      <div className="flex items-center gap-1.5">
                        {config.rubricFile ? <FileText className="w-3 h-3 text-zinc-500" /> : <FileText className="w-3 h-3 text-zinc-500" />}
                        <span className="text-sm text-zinc-600 truncate">
                          {config.rubricFile ? 'PDF Uploaded' : (config.rubric ? 'Text Provided' : 'None')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t border-zinc-100 mt-3">
          <button onClick={handleBack} className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 group text-xs border bg-white text-zinc-900 border-zinc-200 hover:bg-gradient-to-r hover:from-zinc-900 hover:to-zinc-800 hover:text-white hover:border-zinc-900 hover:shadow-lg hover:scale-105">
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className={`flex items-center gap-1.5 px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 group text-xs border ${isStepValid()
              ? 'bg-white text-zinc-900 border-zinc-200 hover:bg-gradient-to-r hover:from-zinc-900 hover:to-zinc-800 hover:text-white hover:border-zinc-900 hover:shadow-lg hover:scale-105'
              : 'bg-white text-zinc-900 border-zinc-200 cursor-not-allowed'
              }`}
          >
            {step === 5 ? 'Review' : (step === 6 ? 'Create Assignment' : 'Continue')}
            <ChevronRight className={`w-3 h-3 ${isStepValid() ? 'group-hover:translate-x-1' : ''} transition-transform`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupForm;
