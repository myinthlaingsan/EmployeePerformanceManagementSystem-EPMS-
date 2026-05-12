import React from 'react';
import { Settings, Play, CheckCircle2, Search } from 'lucide-react';

interface StepperProps {
  currentStatus: string;
}

const steps = [
  { 
    id: 'PHASE_1', 
    label: '1. Setup & Validation', 
    icon: Search, 
    desc: 'Review & Lock List',
    statuses: ['PLANNING', 'FINALIZED']
  },
  { 
    id: 'PHASE_2', 
    label: '2. Launch & Monitoring', 
    icon: Play, 
    desc: 'Cycle Live',
    statuses: ['GENERATED', 'LOCKED', 'IN_PROGRESS', 'EVALUATION']
  }
];

export const CycleWorkflowStepper: React.FC<StepperProps> = ({ currentStatus }) => {
  return (
    <div className="bg-white/80 backdrop-blur-md p-10 rounded-[2.5rem] border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
      <div className="flex items-center justify-center max-w-2xl mx-auto relative gap-24 md:gap-40">
        {/* Background Line */}
        <div className="absolute top-[32px] left-0 w-full h-[2px] bg-slate-100 z-0" />
        
        {steps.map((step, i) => {
          const isCurrentPhase = step.statuses.includes(currentStatus);
          const isCompleted = i === 0 && steps[1].statuses.includes(currentStatus);
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-4 group">
              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 shadow-xl ${
                isCompleted ? 'bg-emerald-500 text-white shadow-emerald-100 rotate-[360deg]' :
                isCurrentPhase ? 'bg-indigo-600 text-white shadow-indigo-200 scale-110 ring-8 ring-indigo-50' :
                'bg-white text-slate-300 border-2 border-slate-100 shadow-none'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-8 h-8" /> : <step.icon className="w-8 h-8" />}
              </div>
              <div className="text-center">
                <div className={`text-base font-black tracking-tight ${isCurrentPhase ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {step.label}
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  {step.desc}
                </div>
              </div>
              
              {/* Connector Highlight */}
              {i === 0 && isCompleted && (
                <div className="absolute top-[32px] left-1/2 w-[calc(100%+8rem)] md:w-[calc(100%+12rem)] h-[2px] bg-emerald-500 z-[-1] transition-all duration-1000" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
