import { Route, Routes, Navigate, useLocation } from 'react-router';
import { useState, JSX } from 'react';
import { Header } from './components/shared/Header';
import { EncounterPageWrapper } from './components/encounter/EncounterPageWrapper';
import { SignInPage } from './pages/auth/SignInPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PatientPage } from './pages/patient/PatientPage';
import { HomePage } from './pages/HomePage';
import { ManageUsersPage } from './pages/admin/ManageUsersPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { NoteTemplatesPage } from './pages/admin/NoteTemplatesPage';
import { AppointmentTypesPage } from './pages/admin/AppointmentTypesPage';
import { LabTestsPage } from './pages/admin/LabTestsPage';
import { ImagingTestsPage } from './pages/admin/ImagingTestsPage';
import { DiagnosticProvidersPage } from './pages/admin/DiagnosticProvidersPage';
import { DiagnosisCodesPage } from './pages/admin/DiagnosisCodesPage';
import { MedicationCatalogPage } from './pages/admin/MedicationCatalogPage';
import { InventoryPage } from './pages/admin/InventoryPage';
import { DepartmentsPage } from './pages/admin/DepartmentsPage';
import { BedsPage } from './pages/admin/BedsPage';
import { ScheduleManagementPage } from './pages/scheduling/ScheduleManagementPage';
import { BookAppointmentPage } from './pages/scheduling/BookAppointmentPage';
import { ProviderCalendarPage } from './pages/scheduling/ProviderCalendarPage';
import { BillingPage } from './pages/billing/BillingPage';
import { RequireAdmin } from './components/auth/RequireAdmin';
import { Container } from '@mantine/core';
import { Patient } from '@medplum/fhirtypes';
import { useMedplum, Loading } from '@medplum/react';
import { useMembership } from './hooks/usePermissions';

export function EMRApp(): JSX.Element {
  const medplum = useMedplum();
  const [, setPatient] = useState<Patient | null>(null);
  const location = useLocation();
  const membership = useMembership();

  // Show loading while checking authentication
  if (medplum.isLoading()) {
    return <Loading />;
  }

  // Check if user is authenticated
  const profile = medplum.getProfile();
  const isAuthenticated = !!profile;

  // If not authenticated and not on auth pages, redirect to sign in
  if (!isAuthenticated && location.pathname !== '/signin' && location.pathname !== '/register') {
    return <Navigate to="/signin" replace />;
  }

  // Show auth pages when on those routes
  if (location.pathname === '/signin') {
    return <SignInPage />;
  }

  if (location.pathname === '/register') {
    return <RegisterPage />;
  }

  // Main authenticated app
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Header onPatientSelect={p => { setPatient(p); }} />
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/patient/:id" element={<PatientPage />} />
        <Route path="/Encounter/:id" element={<EncounterPageWrapper />} />
        <Route
          path="/admin/users"
          element={
            <RequireAdmin membership={membership!}>
              <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
                <ManageUsersPage />
              </Container>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RequireAdmin membership={membership!}>
              <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
                <SettingsPage />
              </Container>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/note-templates"
          element={
            <RequireAdmin membership={membership!}>
              <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
                <NoteTemplatesPage />
              </Container>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/appointment-types"
          element={
            <RequireAdmin membership={membership!}>
              <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
                <AppointmentTypesPage />
              </Container>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/lab-tests"
          element={
            <RequireAdmin membership={membership!}>
              <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
                <LabTestsPage />
              </Container>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/imaging-tests"
          element={
            <RequireAdmin membership={membership!}>
              <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
                <ImagingTestsPage />
              </Container>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/diagnostic-providers"
          element={
            <RequireAdmin membership={membership!}>
              <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
                <DiagnosticProvidersPage />
              </Container>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/diagnosis-codes"
          element={
            <RequireAdmin membership={membership!}>
              <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
                <DiagnosisCodesPage />
              </Container>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/medications"
          element={
            <RequireAdmin membership={membership!}>
              <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
                <MedicationCatalogPage />
              </Container>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <RequireAdmin membership={membership!}>
              <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
                <InventoryPage />
              </Container>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <RequireAdmin membership={membership!}>
              <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
                <DepartmentsPage />
              </Container>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/beds"
          element={
            <RequireAdmin membership={membership!}>
              <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
                <BedsPage />
              </Container>
            </RequireAdmin>
          }
        />
        <Route
          path="/scheduling/manage"
          element={
            <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
              <ScheduleManagementPage />
            </Container>
          }
        />
        <Route
          path="/scheduling/book"
          element={
            <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
              <BookAppointmentPage />
            </Container>
          }
        />
        <Route
          path="/scheduling/calendar"
          element={
            <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
              <ProviderCalendarPage />
            </Container>
          }
        />
        <Route
          path="/billing"
          element={
            <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
              <BillingPage />
            </Container>
          }
        />
        <Route
          path="/*"
          element={
            <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
              <HomePage />
            </Container>
          }
        />
      </Routes>
    </div>
  );
}
