import { Container } from '@mantine/core';
import { Patient } from '@medplum/fhirtypes';
import { Loading, useMedplum } from '@medplum/react';
import { JSX, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { PatientSidebar } from '../../components/patient/PatientSidebar';
import { PatientMainSection } from '../../components/patient/PatientMainSection';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav';
import { NewEncounterModal } from '../../components/encounter/NewEncounterModal';

export function PatientPage(): JSX.Element {
  const medplum = useMedplum();
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [section, setSection] = useState('demographics');
  const [newEncounterModalOpen, setNewEncounterModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = (): void => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    if (!id) {return;}

    medplum
      .readResource('Patient', id)
      .then(setPatient)
      .catch(() => {
        // Handle error silently
      });
  }, [medplum, id, refreshKey]);

  if (!patient) {
    return <Loading />;
  }

  const patientBreadcrumb = {
    id: patient.id as string,
    name: patient.name?.[0]?.text || 
          [patient.name?.[0]?.given?.[0], patient.name?.[0]?.family].filter(Boolean).join(' ') ||
          'Unknown Patient'
  };

  return (
    <Container fluid size="100%" style={{ padding: '8px 12px', margin: 0, maxWidth: '100%' }} m={0}>
      {patient && <NewEncounterModal opened={newEncounterModalOpen} onClose={() => setNewEncounterModalOpen(false)} patient={patient} />}
      
      <BreadcrumbNav patient={patientBreadcrumb} />
      
      <div style={{ display: 'flex', gap: '8px', minHeight: '80vh', alignItems: 'flex-start', width: '100%' }}>
        <div style={{ minWidth: '300px', maxWidth: '300px', flexShrink: 0 }}>
          <PatientSidebar 
            patient={patient} 
            selectedSection={section} 
            onSectionSelect={setSection}
            onPatientUpdate={triggerRefresh}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <PatientMainSection 
            section={section} 
            patient={patient} 
            onNewEncounter={() => setNewEncounterModalOpen(true)}
          />
        </div>
      </div>
    </Container>
  );
}

