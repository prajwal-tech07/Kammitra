import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Worker from "./pages/Worker";
import Employer from "./pages/Employer";
import WorkerSetup from "./pages/WorkerSetup";
import WorkerDashboard from "./pages/WorkerDashboard";
import WorkerApplications from "./pages/WorkerApplications";
import WorkerProfile from "./pages/WorkerProfile";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerProfile from "./pages/EmployerProfile";
import PostJob from "./pages/PostJob";
import JobApplicants from "./pages/JobApplicants";
import SchemesPage from "./pages/SchemesPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/worker" element={<Worker />} />
        <Route path="/employer" element={<Employer />} />
        <Route path="/worker/setup" element={<WorkerSetup />} />
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/worker/applications" element={<WorkerApplications />} />
        <Route path="/worker/profile" element={<WorkerProfile />} />
        <Route path="/employer/dashboard" element={<EmployerDashboard />} />
        <Route path="/employer/profile" element={<EmployerProfile />} />
        <Route path="/employer/post-job" element={<PostJob />} />
        <Route path="/employer/jobs/:jobId/applicants" element={<JobApplicants />} />
        <Route path="/schemes" element={<SchemesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
