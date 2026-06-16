import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { AdminAnnouncementsPage } from './pages/AdminAnnouncementsPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminDocumentsPage } from './pages/AdminDocumentsPage'
import { AdminGroupsPage } from './pages/AdminGroupsPage'
import { AdminRegistrationsPage } from './pages/AdminRegistrationsPage'
import { AdminInstructorsPage } from './pages/AdminInstructorsPage'
import { AdminLevelsPage } from './pages/AdminLevelsPage'
import { AdminLocationsPage } from './pages/AdminLocationsPage'
import { AdminPaymentsPage } from './pages/AdminPaymentsPage'
import { AdminPhotosPage } from './pages/AdminPhotosPage'
import { AdminSwimmersPage } from './pages/AdminSwimmersPage'
import { AdminTermsPage } from './pages/AdminTermsPage'
import { InstructorAttendancePage } from './pages/InstructorAttendancePage'
import { InstructorDashboardPage } from './pages/InstructorDashboardPage'
import { InstructorSchedulePage } from './pages/InstructorSchedulePage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ParentDashboardPage } from './pages/ParentDashboardPage'
import { ParentPaymentsPage } from './pages/ParentPaymentsPage'
import { ParentPhotosPage } from './pages/ParentPhotosPage'
import { ParentSchedulePage } from './pages/ParentSchedulePage'
import { ParentSwimmersPage } from './pages/ParentSwimmersPage'
import { PortalSimpleListPage } from './pages/PortalSimpleListPage'
import { RegisterPage } from './pages/RegisterPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<PlaceholderPage title="Forgot Password" />} />
      <Route path="/reset-password" element={<PlaceholderPage title="Reset Password" />} />

      <Route element={<RequireAuth allow={['ADMIN']} />}>
        <Route path="/admin" element={<AppShell role="Admin" />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="registrations" element={<AdminRegistrationsPage />} />
          <Route path="documents" element={<AdminDocumentsPage />} />
          <Route path="swimmers" element={<AdminSwimmersPage />} />
          <Route path="instructors" element={<AdminInstructorsPage />} />
          <Route path="groups" element={<AdminGroupsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="photos" element={<AdminPhotosPage />} />
          <Route path="announcements" element={<AdminAnnouncementsPage />} />
          <Route path="settings/levels" element={<AdminLevelsPage />} />
          <Route path="settings/locations" element={<AdminLocationsPage />} />
          <Route path="settings/terms" element={<AdminTermsPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth allow={['PARENT']} />}>
        <Route path="/portal" element={<AppShell role="Parent" mobileTabs />}>
          <Route index element={<ParentDashboardPage />} />
          <Route path="swimmers" element={<ParentSwimmersPage />} />
          <Route path="schedule" element={<ParentSchedulePage />} />
          <Route path="payments" element={<ParentPaymentsPage />} />
          <Route path="photos" element={<ParentPhotosPage />} />
          <Route path="consent" element={<PortalSimpleListPage title="Consent Forms" endpoint="/api/consent-forms" />} />
          <Route path="announcements" element={<PortalSimpleListPage title="Announcements" endpoint="/api/parent/announcements" />} />
        </Route>
      </Route>

      <Route element={<RequireAuth allow={['INSTRUCTOR']} />}>
        <Route path="/instructor" element={<AppShell role="Instructor" mobileTabs />}>
          <Route index element={<InstructorDashboardPage />} />
          <Route path="schedule" element={<InstructorSchedulePage />} />
          <Route path="sessions/:id/attendance" element={<InstructorAttendancePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
