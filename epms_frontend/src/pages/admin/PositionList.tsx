import { useGetPositionsQuery, useCreatePositionMutation, useDeletePositionMutation } from "../../features/org/positionApi";
import { useGetJobLevelsQuery } from "../../features/org/jobLevelApi";
import { useState } from "react";

const PositionList = () => {
  const { data: positions, isLoading: positionsLoading, error: positionsError } = useGetPositionsQuery();
  const { data: levels, isLoading: levelsLoading } = useGetJobLevelsQuery();
  
  const [createPosition] = useCreatePositionMutation();
  const [deletePosition] = useDeletePositionMutation();
  
  const [newPositionName, setNewPositionName] = useState("");
  const [newPositionCode, setNewPositionCode] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState<number | "">("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPositionName.trim() || !newPositionCode.trim() || !selectedLevelId) return;
    try {
      await createPosition({ 
        positionName: newPositionName,
        positionCode: newPositionCode,
        levelId: Number(selectedLevelId)
      }).unwrap();
      setNewPositionName("");
      setNewPositionCode("");
      setSelectedLevelId("");
    } catch (err) {
      console.error("Failed to create position", err);
    }
  };

  if (positionsLoading || levelsLoading) return <div className="p-8 text-center">Loading data...</div>;
  if (positionsError) return <div className="p-8 text-red-500">Error loading positions.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Positions</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Code (e.g. SE)"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={newPositionCode}
            onChange={(e) => setNewPositionCode(e.target.value)}
          />
          <input
            type="text"
            placeholder="Position Name"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={newPositionName}
            onChange={(e) => setNewPositionName(e.target.value)}
          />
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedLevelId}
            onChange={(e) => setSelectedLevelId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Select Level</option>
            {levels?.map(level => (
              <option key={level.levelId} value={level.levelId}>
                {level.levelName} ({level.levelCode})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Add Position
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Code</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Position Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Level</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {positions?.map((pos) => (
              <tr key={pos.positionId} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-mono text-blue-600">{pos.positionCode}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{pos.positionName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{pos.levelName}</td>
                <td className="px-6 py-4 text-sm text-right">
                  <button
                    onClick={() => deletePosition(pos.positionId)}
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

export default PositionList;
