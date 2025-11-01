import { PatientTimeline as MedplumPatientTimeline } from '@medplum/react';
import { Patient } from '@medplum/fhirtypes';
import { JSX } from 'react';

// No user-facing strings to translate in PatientTimeline

interface PatientTimelineProps {
  patient: Patient;
}

export function PatientTimeline({ patient }: PatientTimelineProps): JSX.Element {
  return (
    <div style={{ marginTop: '20px' }}>
      <MedplumPatientTimeline patient={patient} />
    </div>
  );
}

