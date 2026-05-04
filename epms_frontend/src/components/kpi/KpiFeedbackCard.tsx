import React from 'react';

const KpiFeedbackCard: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-[#1e3a8a] rounded-[2.5rem] p-10 text-white shadow-xl shadow-blue-900/10 group">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay transition-transform duration-700 group-hover:scale-110" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000')" }}
      ></div>
      
      {/* Decorative Quote Mark */}
      <div className="absolute -top-6 -left-2 text-[12rem] font-serif text-white/5 select-none leading-none pointer-events-none">
        "
      </div>

      <div className="relative z-10">
        <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.25em] mb-8">
          Manager Feedback
        </p>
        
        <p className="text-[1.25rem] font-bold italic leading-relaxed mb-10 tracking-tight">
          "Your progress on the retention initiative is setting a benchmark for the department. Keep up the excellent work, Alex!"
        </p>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden shadow-lg bg-slate-800">
             <img 
               src="https://i.pravatar.cc/100?u=sarah" 
               alt="Sarah Jenkins" 
               className="w-full h-full object-cover"
             />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-black text-white">Sarah Jenkins</p>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
              Director of Customer Success
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default KpiFeedbackCard;
