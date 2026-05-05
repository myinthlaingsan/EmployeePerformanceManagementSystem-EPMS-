import React from 'react';
import { 
  useGetDiagnosticHealthQuery, 
  useGetAppraisalsQuery 
} from '../../features/appraisal/appraisalApi';

const DiagnosticPage: React.FC = () => {
  const { data, error, isLoading, refetch } = useGetDiagnosticHealthQuery();
  const { data: appraisals, error: appError } = useGetAppraisalsQuery();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Appraisal Diagnostics</h1>
        <button 
          onClick={() => refetch()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Refresh Data
        </button>
      </div>

      {isLoading && <p>Loading diagnostics...</p>}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 mb-6">
          <h2 className="font-bold mb-2">Diagnostic Endpoint Error (New Endpoint)</h2>
          <p className="text-sm mb-2">The backend likely hasn't been restarted/recompiled to see the new diagnostic endpoint.</p>
          <pre className="text-xs overflow-auto">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-4">Appraisal List Test (Existing Endpoint)</h2>
        {appError ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
            <p className="font-bold">Error calling /appraisals/my-assessments:</p>
            <pre className="text-xs">{JSON.stringify(appError, null, 2)}</pre>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <p className="font-bold">Successfully called /appraisals/my-assessments</p>
            <p className="text-sm">Found {appraisals?.length || 0} appraisals.</p>
          </div>
        )}
      </div>

      {data && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Current User Context</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 uppercase font-bold">Email from Token</p>
                <p className="font-mono text-sm">{data.currentUserEmail}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 uppercase font-bold">Employee Record Status</p>
                <p className={`font-bold ${data.employeeRecordFound ? 'text-emerald-600' : 'text-red-600'}`}>
                  {data.employeeRecordFound ? 'FOUND' : 'NOT FOUND'}
                </p>
              </div>
            </div>
            {!data.employeeRecordFound && (
              <div className="mt-4 p-4 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-sm">
                <strong>Warning:</strong> Your login email does not match any entry in the Employee table. This will cause "Operation failed" errors in the Appraisal module.
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Appraisal Data</h2>
            <div className="p-4 bg-slate-50 rounded-xl mb-4">
              <p className="text-xs text-slate-500 uppercase font-bold">Appraisal Count for User</p>
              <p className="text-2xl font-bold">{data.appraisalCount}</p>
            </div>

            {data.firstAppraisalDetails ? (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800">First Appraisal Check:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border border-slate-100 rounded-lg">
                    <p className="text-slate-500">ID</p>
                    <p className="font-mono">{data.firstAppraisalDetails.id}</p>
                  </div>
                  <div className="p-3 border border-slate-100 rounded-lg">
                    <p className="text-slate-500">Status</p>
                    <p className="font-bold">{data.firstAppraisalDetails.status}</p>
                  </div>
                  <div className="p-3 border border-slate-100 rounded-lg">
                    <p className="text-slate-500">Cycle Name</p>
                    <p className="font-bold">{data.firstAppraisalDetails.cycleName}</p>
                  </div>
                  <div className="p-3 border border-slate-100 rounded-lg">
                    <p className="text-slate-500">Forms in Cycle</p>
                    <p className="font-bold">{data.firstAppraisalDetails.formCount}</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${data.firstAppraisalDetails.hasSelfAssessmentForm ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                  {data.firstAppraisalDetails.hasSelfAssessmentForm 
                    ? '✓ SELF_ASSESSMENT form is correctly configured for this cycle.' 
                    : '✗ MISSING SELF_ASSESSMENT form in this cycle! This will cause "Appraisal not found" errors when trying to assess.'}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-sm">
                No appraisals found for this employee.
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl text-white">
            <h2 className="text-xl font-bold mb-2">Raw JSON Response</h2>
            <pre className="text-xs overflow-auto bg-slate-800 p-4 rounded-xl mt-4">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticPage;
