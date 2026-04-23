import { useGetJobLevelsQuery, useCreateJobLevelMutation, useDeleteJobLevelMutation } from "../../features/org/jobLevelApi";
import { useState } from "react";

const JobLevelList = () => {
  const { data: levels, isLoading, error } = useGetJobLevelsQuery();
  const [createLevel] = useCreateJobLevelMutation();
  const [deleteLevel] = useDeleteJobLevelMutation();
  
  const [newLevelName, setNewLevelName] = useState("");
  const [newLevelCode, setNewLevelCode] = useState("");
  const [newLevelRank, setNewLevelRank] = useState<number>(1);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLevelName.trim() || !newLevelCode.trim()) return;
    try {
      await createLevel({ 
        levelName: newLevelName,
        levelCode: newLevelCode,
        levelRank: newLevelRank
      }).unwrap();
      setNewLevelName("");
      setNewLevelCode("");
      setNewLevelRank(1);
    } catch (err) {
      console.error("Failed to create job level", err);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading job levels...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading job levels.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Job Levels</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Level Name (e.g. Senior)"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={newLevelName}
            onChange={(e) => setNewLevelName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Code (e.g. L04)"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={newLevelCode}
            onChange={(e) => setNewLevelCode(e.target.value)}
          />
          <input
            type="number"
            placeholder="Rank"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={newLevelRank}
            onChange={(e) => setNewLevelRank(parseInt(e.target.value))}
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Add Level
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Code</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {levels?.map((level) => (
              <tr key={level.levelId} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-mono text-blue-600">{level.levelCode}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{level.levelName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{level.levelRank}</td>
                <td className="px-6 py-4 text-sm text-right">
                  <button
                    onClick={() => deleteLevel(level.levelId)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobLevelList;
