import IdpCreatePage from "../pages/idp/IdpCreatePage";
import IdpDetailsPage from "../pages/idp/IdpDetailsPage";
import IdpListPage from "../pages/idp/IdpListPage";

export const idpRoutes = [
  { path: "/idp", element: <IdpListPage /> },
  { path: "/idp/new", element: <IdpCreatePage /> },
  { path: "/idp/:id", element: <IdpDetailsPage /> },
];
