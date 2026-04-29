import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Save, Plus, Info, Check, Lock, Box, MoreVertical, Calendar } from 'lucide-react';

const AppraisalAdminDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="p-8 max-w-[1400px] mx-auto bg-[#fafafa] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Appraisal Management</h1>
          <p className="text-gray-500 mt-1.5 text-base">Orchestrate performance cycles and design strategic review frameworks.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-gray-200/60 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors shadow-sm text-sm">
            Archive Selected
          </button>
          <button className="px-5 py-2.5 bg-[#0f62fe] hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm text-sm">
            Launch New Cycle
          </button>
        </div>
      </div>

      {/* Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Cycle Parameters */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] p-6 border border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-500 tracking-wider mb-6">CYCLE PARAMETERS</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cycle Title</label>
              <input 
                type="text" 
                placeholder="e.g., Annual Performance Review 2"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm text-gray-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="mm/dd/yyyy"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm text-gray-800"
                  />
                  <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="mm/dd/yyyy"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm text-gray-800"
                  />
                  <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Frequency</label>
              <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm text-gray-800 appearance-none">
                <option>Annual</option>
                <option>Semi-Annual</option>
                <option>Quarterly</option>
              </select>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="bg-[#f2f7ff] rounded-lg p-4 flex gap-3 items-start border border-[#e5eeff]">
                <div className="mt-0.5 w-5 h-5 bg-[#0f62fe] rounded-full flex items-center justify-center shrink-0">
                  <Info className="w-3 h-3 text-white" />
                </div>
                <p className="text-[13px] text-[#0f62fe] leading-relaxed font-medium">
                  Cycles are automatically locked 7 days after the end date to ensure data integrity for payroll adjustments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Form Builder */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[13px] font-bold text-gray-500 tracking-wider">CUSTOM FORM BUILDER</h2>
            <div className="flex gap-4 text-gray-700">
              <button className="hover:text-black transition-colors"><Eye className="w-5 h-5" /></button>
              <button className="hover:text-black transition-colors"><Save className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Field 1 */}
            <div className="border-l-[3px] border-[#0f62fe] bg-[#fafbfc] rounded-r-xl p-5 shadow-sm border-y border-r border-y-gray-100 border-r-gray-100">
              <div className="mb-4">
                <h3 className="text-[17px] font-bold text-gray-900">Employee Self-Reflection</h3>
                <p className="text-xs text-gray-500 mt-1 font-medium">Section: Quantitative Performance</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase">Input Type</label>
                  <div className="flex items-center gap-2 bg-gray-100/80 px-3 py-2 rounded-lg text-sm text-gray-800 font-medium border border-gray-200/50">
                    <span className="text-blue-500 font-black">o-o</span> Rating Scale (1-5)
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase">Requirement</label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 bg-[#0f62fe] rounded flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">Mandatory for submission</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Field 2 */}
            <div className="border-l-[3px] border-[#e0e0e0] bg-[#fafbfc] rounded-r-xl p-5 shadow-sm border-y border-r border-y-gray-100 border-r-gray-100">
              <div className="mb-4">
                <h3 className="text-[17px] font-bold text-gray-900">Key Achievements & Milestones</h3>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase">Input Type</label>
                <div className="flex items-center gap-2 bg-gray-100/80 px-3 py-2 rounded-lg text-sm text-gray-800 font-medium border border-gray-200/50 w-fit">
                  <span className="text-gray-500 font-black">≡</span> Long-form Text Area
                </div>
              </div>
            </div>

            {/* Append Button */}
            <button 
              onClick={() => navigate('/appraisal-forms/new')}
              className="w-full py-5 border-2 border-dashed border-gray-200 hover:border-gray-300 hover:border-blue-300 rounded-xl flex flex-col items-center justify-center gap-2 bg-gray-50/50 hover:bg-blue-50/30 transition-all group mt-2"
            >
              <div className="w-7 h-7 bg-gray-600 group-hover:bg-blue-600 transition-colors rounded-full flex items-center justify-center text-white">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 tracking-widest uppercase transition-colors">Append New Assessment Field</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Lifecycle Registry */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-500 tracking-wider">ACTIVE LIFECYCLE REGISTRY</h2>
          <div className="flex gap-2 items-center">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button className="px-4 py-1.5 text-xs font-bold bg-white text-gray-800 rounded shadow-sm">All</button>
              <button className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800">Active</button>
              <button className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800">Draft</button>
            </div>
            <button className="ml-4 text-sm font-bold text-[#0f62fe] hover:text-blue-800 transition-colors">Download Report</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[35%]">Cycle Name</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[20%]">Period</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[25%]">Participation</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[15%]">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right w-[5%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Row 1 */}
              <tr className="hover:bg-gray-50/50 transition">
                <td className="px-6 py-5">
                  <div className="font-bold text-sm text-gray-900 mb-0.5">FY24 Q1 Performance Review</div>
                  <div className="text-[11px] font-medium text-gray-500">Global Operations & Sales</div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[13px] font-medium text-gray-800">Jan 01 - Mar 31, 2024</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] font-bold text-gray-500">88% Complete</span>
                    <span className="text-[10px] font-bold text-gray-500">742/840</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-[#0f62fe] h-1.5 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> ACTIVE
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="text-gray-400 hover:text-gray-600 transition"><MoreVertical className="w-5 h-5" /></button>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-gray-50/50 transition">
                <td className="px-6 py-5">
                  <div className="font-bold text-sm text-gray-900 mb-0.5">Engineering Semi-Annual H2</div>
                  <div className="text-[11px] font-medium text-gray-500">Tech & Product Teams</div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[13px] font-medium text-gray-800">Jul 01 - Dec 31, 2023</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] font-bold text-gray-500">100% Locked</span>
                    <span className="text-[10px] font-bold text-gray-500">124/124</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-gray-400 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-gray-200/80 text-gray-700">
                    <Lock className="w-3 h-3" /> FINALIZED
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="text-gray-400 hover:text-gray-600 transition"><MoreVertical className="w-5 h-5" /></button>
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-gray-50/50 transition">
                <td className="px-6 py-5">
                  <div className="font-bold text-sm text-gray-900 mb-0.5">Leadership Competency 360</div>
                  <div className="text-[11px] font-medium text-gray-500">Executive Board</div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[13px] font-medium text-gray-800">Apr 15 - May 15, 2024</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] font-bold text-gray-500">Pending Launch</span>
                    <span className="text-[10px] font-bold text-gray-500">0%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-gray-300 h-1.5 rounded-full" style={{ width: '5%' }}></div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#e3e8f0] text-gray-700">
                    <Box className="w-3 h-3" /> DRAFT
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="text-gray-400 hover:text-gray-600 transition"><MoreVertical className="w-5 h-5" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AppraisalAdminDashboard;
