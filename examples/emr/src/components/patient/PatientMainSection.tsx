import { Patient } from '@medplum/fhirtypes';
import { Document, ResourceTable, ResourceHistoryTable, ResourceForm } from '@medplum/react';
import { Tabs, Paper, Group, Text, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PatientTimeline } from './PatientTimeline';
import { PatientEncounters } from './PatientEncounters';
import { PatientObservations } from './PatientObservations';
import { ClinicalImpressionDisplay } from '../shared/ClinicalImpressionDisplay';
import { PatientOverview } from './PatientOverview';

interface PatientMainSectionProps {
  section: string;
  patient: Patient | null;
  onNewEncounter?: () => void;
}

export function PatientMainSection({ patient, onNewEncounter }: PatientMainSectionProps): JSX.Element {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('overview');

  if (!patient) {
    return (
      <Document>
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          {t('patient.selectToViewDetails', 'Select a patient to view details.')}
        </div>
      </Document>
    );
  }

  return (
    <Document>
      {/* Quick Actions */}
      <Paper shadow="sm" p="md" mb="md" withBorder style={{ marginTop: 0 }}>
        <Group justify="space-between">
          <Text size="sm" fw={500}>{t('patient.quickActions', 'Quick Actions')}</Text>
          <Group>
            {onNewEncounter && (
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={onNewEncounter}
                variant="light"
              >
                {t('patient.newEncounter', 'New Encounter')}
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'overview')}>
        <Tabs.List>
          <Tabs.Tab value="overview">{t('patient.tab.overview', 'Overview')}</Tabs.Tab>
          <Tabs.Tab value="timeline">{t('patient.tab.timeline', 'Timeline')}</Tabs.Tab>
          <Tabs.Tab value="edit">{t('patient.tab.edit', 'Edit')}</Tabs.Tab>
          <Tabs.Tab value="encounter">{t('patient.tab.encounter', 'Encounter')}</Tabs.Tab>
          <Tabs.Tab value="observations">{t('patient.tab.observations', 'Observations')}</Tabs.Tab>
          <Tabs.Tab value="clinical">{t('patient.tab.clinicalNotes', 'Clinical Notes')}</Tabs.Tab>
          <Tabs.Tab value="details">{t('patient.tab.details', 'Details')}</Tabs.Tab>
          <Tabs.Tab value="history">{t('patient.tab.history', 'History')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <PatientOverview patient={patient} />
        </Tabs.Panel>

        <Tabs.Panel value="timeline" pt="md">
          <PatientTimeline patient={patient} />
        </Tabs.Panel>

        <Tabs.Panel value="edit" pt="md">
          <ResourceForm defaultValue={patient} onSubmit={() => {}} />
        </Tabs.Panel>

        <Tabs.Panel value="encounter" pt="md">
          <PatientEncounters patient={patient} />
        </Tabs.Panel>

        <Tabs.Panel value="observations" pt="md">
          <PatientObservations patient={patient} />
        </Tabs.Panel>

        <Tabs.Panel value="clinical" pt="md">
          <ClinicalImpressionDisplay patient={patient} />
        </Tabs.Panel>

        <Tabs.Panel value="details" pt="md">
          <ResourceTable value={patient} />
        </Tabs.Panel>

        <Tabs.Panel value="history" pt="md">
          <ResourceHistoryTable resourceType="Patient" id={patient.id as string} />
        </Tabs.Panel>
      </Tabs>
    </Document>
  );
}
