import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCycleMutation } from '../../features/appraisal/appraisalApi';
import { useGetFinancialYearsQuery } from '../../features/appraisal/financialYearApi';
import {
  Calendar,
  ChevronLeft,
  Target,
  UserCheck,
  MessageSquare,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { subDays, isBefore, format, addMonths } from 'date-fns';

const AppraisalCycleCreate: React.FC = () => {
  const navigate = useNavigate();
  const [createCycle, { isLoading }] = useCreateCycleMutation();
  const { data: financialYears = [] } = useGetFinancialYearsQuery();

  const [creationMode, setCreationMode] = useState<'MANUAL' | 'FINANCIAL_YEAR'>('FINANCIAL_YEAR');
  const [frequency, setFrequency] = useState<'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY'>('ANNUAL');
  const [period, setPeriod] = useState<string>('FULL');

  // Basic Info
  const [formData, setFormData] = useState({
    cycleName: '2024 Annual Performance Review',
    startDate: '',
    endDate: '',
    selfAssessmentDeadline: '',
    managerEvaluationDeadline: '',
    finalizationDeadline: '',
    evaluationPeriod: 'Q1-Q4 2024',
    status: 'PLANNING',
    isActive: false,
    // Weights
    kpiWeight: 40,
    managerWeight: 30,
    feedbackWeight: 10,
    selfWeight: 20,
    financialYearId: ''
  });

  // Set default financial year to current active year if not set manually
  React.useEffect(() => {
    if (!formData.financialYearId && financialYears.length > 0) {
      const currentYear = financialYears.find(y => y.isCurrent);
      if (currentYear) {
        setFormData(prev => ({ ...prev, financialYearId: currentYear.id.toString() }));
      }
    }
  }, [financialYears, formData.financialYearId]);

  // Automated Date Calculations for Financial Year Mode
  React.useEffect(() => {
    if (creationMode === 'FINANCIAL_YEAR' && formData.financialYearId && financialYears.length > 0) {
      const selectedYear = financialYears.find(y => y.id.toString() === formData.financialYearId);
      if (selectedYear) {
        const fyStart = new Date(selectedYear.startDate);
        const fyEnd = new Date(selectedYear.endDate);

        let newStart = new Date(fyStart);
        let newEnd = new Date(fyEnd);

        if (frequency === 'SEMI_ANNUAL') {
          if (period === 'H1') {
            newEnd = subDays(addMonths(fyStart, 6), 1);
          } else {
            newStart = addMonths(fyStart, 6);
          }
        } else if (frequency === 'QUARTERLY') {
          if (period === 'Q1') {
            newEnd = subDays(addMonths(fyStart, 3), 1);
          } else if (period === 'Q2') {
            newStart = addMonths(fyStart, 3);
            newEnd = subDays(addMonths(fyStart, 6), 1);
          } else if (period === 'Q3') {
            newStart = addMonths(fyStart, 6);
            newEnd = subDays(addMonths(fyStart, 9), 1);
          } else if (period === 'Q4') {
            newStart = addMonths(fyStart, 9);
          }
        }

        const startStr = format(newStart, 'yyyy-MM-dd');
        const endStr = format(newEnd, 'yyyy-MM-dd');

        const finalization = subDays(newEnd, 5);
        const manager = subDays(finalization, 5);
        const self = subDays(manager, 10);

        setFormData(prev => ({
          ...prev,
          startDate: startStr,
          endDate: endStr,
          finalizationDeadline: format(finalization, 'yyyy-MM-dd'),
          managerEvaluationDeadline: format(manager, 'yyyy-MM-dd'),
          selfAssessmentDeadline: format(self, 'yyyy-MM-dd'),
          evaluationPeriod: `${selectedYear.title} - ${period === 'FULL' ? 'Annual' : period}`
        }));
      }
    }
  }, [creationMode, formData.financialYearId, frequency, period, financialYears]);

  const totalWeight = Number(formData.kpiWeight) + Number(formData.managerWeight) +
    Number(formData.feedbackWeight) + Number(formData.selfWeight);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      alert('Total weights must sum to 100%');
      return;
    }

    if (creationMode === 'FINANCIAL_YEAR' && !formData.financialYearId) {
      alert('Please select a Financial Year.');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      alert('Please ensure both Start Date and End Date are selected.');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert('End Date cannot be before Start Date');
      return;
    }

    try {
      const requestData = {
        ...formData,
        financialYearId: (creationMode === 'FINANCIAL_YEAR' && formData.financialYearId) ? Number(formData.financialYearId) : undefined
      };
      await createCycle(requestData).unwrap();
      alert('Appraisal Cycle created successfully!');
      navigate('/appraisal', {
        state: {
          activeTab: 'forms',
          expandedCycle: formData.cycleName
        }
      });
    } catch (err: any) {
      console.error('Failed to create cycle:', err);
      const errorMessage = err?.data?.message || err?.error || err?.message || JSON.stringify(err);
      alert(`Error creating cycle:\n\n${errorMessage}`);
    }
  };

  const handleDateChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };

    if ((field === 'startDate' || field === 'endDate') && updatedData.startDate && updatedData.endDate) {
      const start = new Date(updatedData.startDate);
      const end = new Date(updatedData.endDate);

      if (isBefore(start, end) || start.getTime() === end.getTime()) {
        const finalization = subDays(end, 5);
        const manager = subDays(finalization, 5);
        const self = subDays(manager, 10);

        updatedData.finalizationDeadline = format(finalization, 'yyyy-MM-dd');
        updatedData.managerEvaluationDeadline = format(manager, 'yyyy-MM-dd');
        updatedData.selfAssessmentDeadline = format(self, 'yyyy-MM-dd');
      }
    }

    setFormData(updatedData);
  };

  const inputClass = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Configure New Cycle</h1>
            <p className="text-slate-400 text-xs">Set evaluation periods, deadlines, and scoring weights.</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading || totalWeight !== 100}
          className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
        >
          {isLoading ? 'Creating...' : <><CheckCircle2 className="w-4 h-4" /> Initialize Cycle</>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto mt-10 px-4 grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Left Column: General Configuration */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> General Info
            </h2>

            <div className="space-y-5">
              <div className="flex gap-6 mb-6 pb-6 border-b border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="mode" value="MANUAL" checked={creationMode === 'MANUAL'} onChange={() => setCreationMode('MANUAL')} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Manual Dates</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="mode" value="FINANCIAL_YEAR" checked={creationMode === 'FINANCIAL_YEAR'} onChange={() => setCreationMode('FINANCIAL_YEAR')} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Financial Year Based</span>
                </label>
              </div>

              <div>
                <label className={labelClass}>Cycle Name</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. 2024 Year-End Review"
                  value={formData.cycleName}
                  onChange={e => setFormData({ ...formData, cycleName: e.target.value })}
                  required
                />
              </div>

              {creationMode === 'FINANCIAL_YEAR' && (
                <div className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div>
                    <label className={labelClass}>Financial Year</label>
                    <select
                      className={inputClass}
                      value={formData.financialYearId}
                      onChange={e => setFormData({ ...formData, financialYearId: e.target.value })}
                      required
                    >
                      <option value="" disabled>Select Financial Year</option>
                      {financialYears.map(year => (
                        <option key={year.id} value={year.id}>
                          {year.title} {year.isCurrent ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Frequency</label>
                      <select className={inputClass} value={frequency} onChange={e => { setFrequency(e.target.value as any); setPeriod(e.target.value === 'ANNUAL' ? 'FULL' : e.target.value === 'SEMI_ANNUAL' ? 'H1' : 'Q1'); }}>
                        <option value="ANNUAL">Annual</option>
                        <option value="SEMI_ANNUAL">Semi-Annual</option>
                        <option value="QUARTERLY">Quarterly</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Period</label>
                      <select className={inputClass} value={period} onChange={e => setPeriod(e.target.value)} disabled={frequency === 'ANNUAL'}>
                        {frequency === 'ANNUAL' && <option value="FULL">Full Year</option>}
                        {frequency === 'SEMI_ANNUAL' && (
                          <>
                            <option value="H1">First Half (H1)</option>
                            <option value="H2">Second Half (H2)</option>
                          </>
                        )}
                        {frequency === 'QUARTERLY' && (
                          <>
                            <option value="Q1">Quarter 1 (Q1)</option>
                            <option value="Q2">Quarter 2 (Q2)</option>
                            <option value="Q3">Quarter 3 (Q3)</option>
                            <option value="Q4">Quarter 4 (Q4)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>Evaluation Period Title</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. FY 2024 / Q4 2024"
                  value={formData.evaluationPeriod}
                  onChange={e => setFormData({ ...formData, evaluationPeriod: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start Date</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={formData.startDate}
                    onChange={e => handleDateChange('startDate', e.target.value)}
                    disabled={creationMode === 'FINANCIAL_YEAR'}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>End Date</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={formData.endDate}
                    min={formData.startDate}
                    onChange={e => handleDateChange('endDate', e.target.value)}
                    disabled={creationMode === 'FINANCIAL_YEAR'}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Deadlines
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Self Assessment Deadline</label>
                <input
                  type="date"
                  className={inputClass}
                  value={formData.selfAssessmentDeadline}
                  min={formData.startDate}
                  max={formData.endDate}
                  onChange={e => setFormData({ ...formData, selfAssessmentDeadline: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Manager Evaluation Deadline</label>
                <input
                  type="date"
                  className={inputClass}
                  value={formData.managerEvaluationDeadline}
                  min={formData.startDate}
                  max={formData.endDate}
                  onChange={e => setFormData({ ...formData, managerEvaluationDeadline: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Finalization Deadline</label>
                <input
                  type="date"
                  className={inputClass}
                  value={formData.finalizationDeadline}
                  min={formData.startDate}
                  max={formData.endDate}
                  onChange={e => setFormData({ ...formData, finalizationDeadline: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scoring Weights */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" /> Scoring Weights
              </h2>
              <div className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase ${totalWeight === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                Total: {totalWeight}%
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Define how much each component contributes to the final performance score.
            </p>

            <div className="space-y-8">
              {/* KPI Weight */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                    <Target className="w-4 h-4 text-indigo-400" /> KPI Component
                  </label>
                  <span className="text-indigo-600 font-black">{formData.kpiWeight}%</span>
                </div>
                <input
                  type="range" min="0" max="100" step="5"
                  value={formData.kpiWeight}
                  onChange={e => setFormData({ ...formData, kpiWeight: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Manager Weight */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                    <UserCheck className="w-4 h-4 text-emerald-400" /> Manager Review
                  </label>
                  <span className="text-emerald-600 font-black">{formData.managerWeight}%</span>
                </div>
                <input
                  type="range" min="0" max="100" step="5"
                  value={formData.managerWeight}
                  onChange={e => setFormData({ ...formData, managerWeight: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Self Weight */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                    <User className="w-4 h-4 text-amber-400" /> Self Assessment
                  </label>
                  <span className="text-amber-600 font-black">{formData.selfWeight}%</span>
                </div>
                <input
                  type="range" min="0" max="100" step="5"
                  value={formData.selfWeight}
                  onChange={e => setFormData({ ...formData, selfWeight: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Feedback Weight */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                    <MessageSquare className="w-4 h-4 text-purple-400" /> 360° Feedback
                  </label>
                  <span className="text-purple-600 font-black">{formData.feedbackWeight}%</span>
                </div>
                <input
                  type="range" min="0" max="100" step="5"
                  value={formData.feedbackWeight}
                  onChange={e => setFormData({ ...formData, feedbackWeight: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {totalWeight !== 100 && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-rose-600 text-xs font-medium leading-relaxed">
                    The sum of all weights must be exactly 100% to proceed. Current total is {totalWeight}%.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default AppraisalCycleCreate;
