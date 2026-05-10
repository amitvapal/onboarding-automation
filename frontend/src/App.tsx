import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AuditTrailPage } from "./pages/AuditTrailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ReviewPage } from "./pages/ReviewPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { RiskFlagsPage } from "./pages/RiskFlagsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UploadPage } from "./pages/UploadPage";
import { VendorListPage } from "./pages/VendorListPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<UploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vendors" element={<VendorListPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/risk-flags" element={<RiskFlagsPage />} />
          <Route path="/audit-trail" element={<AuditTrailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/review/:vendorId" element={<ReviewPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
