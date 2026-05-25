import Feedback360PendingPage from '../pages/feedback360/Feedback360PendingPage';
import Feedback360ReportPage from '../pages/feedback360/Feedback360ReportPage';
import Feedback360AdminPage from '../pages/feedback360/Feedback360AdminPage';
import Feedback360CompetencyPage from '../pages/feedback360/Feedback360CompetencyPage';
import Feedback360NominationsPage from '../pages/feedback360/Feedback360NominationsPage';
import Feedback360CalibrationPage from '../pages/feedback360/Feedback360CalibrationPage';

export const feedback360Routes = [
  // All authenticated users
  { path: '/360-feedback/pending',              element: <Feedback360PendingPage />,       adminOnly: false },
  { path: '/360-feedback/my-report',            element: <Feedback360ReportPage />,        adminOnly: false },
  { path: '/360-feedback/team-reports/:empId',  element: <Feedback360ReportPage />,        adminOnly: false }, // manager view
  { path: '/360-feedback/nominations',          element: <Feedback360NominationsPage />,   adminOnly: false }, // Phase 4

  // HR / Admin only
  { path: '/360-feedback/admin',                element: <Feedback360AdminPage />,         adminOnly: true  },
  { path: '/360-feedback/admin/competencies',   element: <Feedback360CompetencyPage />,    adminOnly: true  },
  { path: '/360-feedback/calibration',          element: <Feedback360CalibrationPage />,   adminOnly: true  },
];
