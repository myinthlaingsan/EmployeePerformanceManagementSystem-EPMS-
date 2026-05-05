import PipListPage from "../pages/pip/PipListPage";
import PipCreatePage from "../pages/pip/PipCreatePage";
import PipDetailsPage from "../pages/pip/PipDetailsPage";

export const pipRoutes = [
  { path: "/pip", element: <PipListPage /> },
  { path: "/pip/:id", element: <PipDetailsPage /> },
  { path: "/pip/new", element: <PipCreatePage />, adminOnly: true },
];
