import React, { useState } from 'react';
import { Eye, Save, Plus, Info, Check, Lock, Box, MoreVertical, Calendar, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetCyclesQuery, useCreateCycleMutation } from '../../features/appraisal/appraisalApi';

interface Field {
  id: string;
  type: 'RATING' | 'TEXTAREA';
  required: boolean;
  label: string;
}

interface Section {
  id: string;
  title: string;
  fields: Field[];
}

const AppraisalAdminDashboard = () => {
  const navigate = useNavigate();
  const { data: cycles = [], isLoading, isError } = useGetCyclesQuery();
  const [createCycle, { isLoading: isCreating }] = useCreateCycleMutation();

  const [cycleName, setCycleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState('Annual');

  const [sections, setSections] = useState<Section[]>([
    {
      id: 's1',
      title: 'Employee Self-Reflection',
      fields: [
        { id: 'f1', type: 'RATING', required: true, label: 'Quantitative Performance' }
      ]
    }
  ]);

  const handleAddSection = () => {
    setSections([...sections, { id: Date.now().toString(), title: 'New Section', fields: [] }]);
  };

  const handleAddField = (sectionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          fields: [...s.fields, { id: Date.now().toString(), type: 'TEXTAREA', required: false, label: 'New Field' }]
        };
      }
      return s;
    }));
  };

  const handleRemoveField = (sectionId: string, fieldId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, fields: s.fields.filter(f => f.id !== fieldId) };
      }
      return s;
    }));
  };

  const handleRemoveSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const handleLaunchCycle = async () => {
    if (!cycleName || !startDate || !endDate) return alert('Please fill all cycle parameters.');
    try {
      await createCycle({
        name: cycleName,
        startDate,
        endDate,
        frequency
      }).unwrap();
      alert('Appraisal cycle launched successfully!');
      // Reset form
      setCycleName('');
      setStartDate('');
      setEndDate('');
    } catch (err: any) {
      const errMsg = err?.data?.message || 'Operation failed. Please try again.';
      alert(errMsg);
    }
  };

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
          <button 
            onClick={handleLaunchCycle}
            disabled={isCreating}
            className="px-5 py-2.5 bg-[#0f62fe] hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50"
          >
            {isCreating ? 'Launching...' : 'Launch Cycle'}
          </button>
        </div>
      </div>

      {/* Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Cycle Parameters */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] p-6 border border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-500 tracking-wider mb-6">CYCLE PARAMETERS</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cycle Title</label>
              <input 
                type="text" 
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                placeholder="e.g., Annual Performance Review 2"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm text-gray-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Frequency</label>
              <select 
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm text-gray-800"
              >
                <option value="Annual">Annual</option>
                <option value="Semi-Annual">Semi-Annual</option>
                <option value="Quarterly">Quarterly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Form Builder */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[13px] font-bold text-gray-500 tracking-wider">DYNAMIC FORM BUILDER</h2>
            <div className="flex gap-4 text-gray-700">
              <button className="hover:text-black transition-colors" title="Save Draft"><Save className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="space-y-4">
            {sections.map((section, sIndex) => (
              <div key={section.id} className="border-l-[3px] border-[#0f62fe] bg-[#fafbfc] rounded-r-xl p-5 shadow-sm border-y border-r border-y-gray-100 border-r-gray-100 relative">
                <button 
                  onClick={() => handleRemoveSection(section.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="mb-4">
                  <input 
                    type="text" 
                    value={section.title}
                    onChange={(e) => {
                      const newSections = [...sections];
                      newSections[sIndex].title = e.target.value;
                      setSections(newSections);
                    }}
                    className="text-[17px] font-bold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-4">
                  {section.fields.map((field, fIndex) => (
                    <div key={field.id} className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-lg border border-gray-200">
                      <div className="col-span-5">
                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Field Label</label>
                        <input 
                          type="text"
                          value={field.label}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sIndex].fields[fIndex].label = e.target.value;
                            setSections(newSections);
                          }}
                          className="w-full text-sm border-b border-gray-200 focus:outline-none focus:border-blue-500 py-1"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Type</label>
                        <select 
                          value={field.type}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sIndex].fields[fIndex].type = e.target.value as 'RATING' | 'TEXTAREA';
                            setSections(newSections);
                          }}
                          className="w-full text-sm bg-gray-50 border border-gray-200 rounded p-1"
                        >
                          <option value="RATING">Rating (1-5)</option>
                          <option value="TEXTAREA">Textarea</option>
                        </select>
                      </div>
                      <div className="col-span-2 flex flex-col items-center">
                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Required</label>
                        <input 
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sIndex].fields[fIndex].required = e.target.checked;
                            setSections(newSections);
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button onClick={() => handleRemoveField(section.id, field.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => handleAddField(section.id)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
                  >
                    <Plus className="w-3 h-3" /> Add Field
                  </button>
                </div>
              </div>
            ))}

            <button 
              onClick={handleAddSection}
              className="w-full py-4 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-xl flex flex-col items-center justify-center gap-2 bg-gray-50/50 hover:bg-blue-50/30 transition-all group mt-2"
            >
              <div className="w-7 h-7 bg-gray-400 group-hover:bg-blue-600 transition-colors rounded-full flex items-center justify-center text-white">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600 tracking-widest uppercase transition-colors">Add Section</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Lifecycle Registry */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-500 tracking-wider">EXISTING CYCLES</h2>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading cycles...</div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">Failed to load cycles.</div>
          ) : cycles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No cycles created yet.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cycle Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cycles.map((cycle) => (
                  <tr key={cycle.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-5">
                      <div className="font-bold text-sm text-gray-900 mb-0.5">{cycle.name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[13px] font-medium text-gray-800">{cycle.startDate} to {cycle.endDate}</span>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-600">
                      {cycle.frequency}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                        cycle.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                        cycle.status === 'Closed' ? 'bg-gray-200 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {cycle.status || 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppraisalAdminDashboard;
