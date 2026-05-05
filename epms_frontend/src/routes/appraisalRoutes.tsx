import AppraisalList from "../pages/appraisal/AppraisalList";
import AppraisalDetail from "../pages/appraisal/AppraisalDetail";
import SelfAssessment from "../pages/appraisal/SelfAssessment";
import ManagerEvaluation from "../pages/appraisal/ManagerEvaluation";
import ResultPage from "../pages/appraisal/ResultPage";

export const appraisalRoutes = [
  { path: "/appraisal", element: <AppraisalList /> },
  { path: "/appraisal/:id", element: <AppraisalDetail /> },
  { path: "/appraisal/:id/self-assessment", element: <SelfAssessment /> },
  { path: "/appraisal/:id/manager-evaluation", element: <ManagerEvaluation /> },
  { path: "/appraisal/:id/results", element: <ResultPage /> },
];
