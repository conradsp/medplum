import { Paper, Title, Menu, Button, Tabs } from '@mantine/core';
import { formatSearchQuery, Operator, SearchRequest } from '@medplum/core';
import { Coding, Patient } from '@medplum/fhirtypes';
import { Document, SearchControl } from '@medplum/react';
import { IconMenu2, IconChartLine } from '@tabler/icons-react';
import { JSX, useState } from 'react';
import { useNavigate } from 'react-router';
import { logger } from '../../utils/logger';

interface PatientObservationsProps {
  patient: Patient;
}

const weightCoding: Coding = {
  system: 'http://loinc.org',
  code: '29463-7',
  display: 'weight',
};

const heightCoding: Coding = {
  system: 'http://loinc.org',
  code: '8302-2',
  display: 'height',
};

const bloodPressureCoding: Coding = {
  system: 'http://loinc.org',
  code: '85354-9',
  display: 'blood-pressure',
};

const bmiCoding: Coding = {
  system: 'http://loinc.org',
  code: '39156-5',
  display: 'bmi',
};

export function PatientObservations({ patient }: PatientObservationsProps): JSX.Element {
  const navigate = useNavigate();

  const tabs = [
    ['all', 'All Observations'],
    ['height', 'Height'],
    ['weight', 'Weight'],
    ['blood-pressure', 'Blood Pressure'],
    ['bmi', 'BMI'],
  ];
  const [currentTab, setCurrentTab] = useState<string[]>(tabs[0]);

  const search: SearchRequest = {
    resourceType: 'Observation',
    filters: [{ code: 'patient', operator: Operator.EQUALS, value: `Patient/${patient.id}` }],
    fields: ['status', 'code', 'focus'],
  };

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Title order={4} mb="md">
        <IconChartLine size={20} style={{ display: 'inline', marginRight: '8px' }} />
        Observations
      </Title>
      <Menu>
        <Menu.Target>
          <Button leftSection={<IconMenu2 />} variant="default">
            {currentTab[1]}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {tabs.map((tab) => (
            <Menu.Item key={tab[0]} onClick={() => setCurrentTab(tab)}>
              {tab[1]}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
      <Tabs value={currentTab[0]} mt="md">
        <Tabs.Panel value="all">
          <Document>
            <SearchControl
              search={search}
              hideFilters={true}
              hideToolbar={true}
              onClick={(e) => {
                const result = navigate(`/${e.resource.resourceType}/${e.resource.id}`);
                if (result instanceof Promise) {
                  result.catch((error) => logger.error('Failed to load observation reference', error));
                }
              }}
              onChange={(e) => {
                const result = navigate(`/${search.resourceType}${formatSearchQuery(e.definition)}`);
                if (result instanceof Promise) {
                  result.catch((error) => logger.error('Failed to load observation reference', error));
                }
              }}
            />
          </Document>
        </Tabs.Panel>
        <Tabs.Panel value="height">
          <ObservationList code={heightCoding} patient={patient} />
        </Tabs.Panel>
        <Tabs.Panel value="weight">
          <ObservationList code={weightCoding} patient={patient} />
        </Tabs.Panel>
        <Tabs.Panel value="blood-pressure">
          <ObservationList code={bloodPressureCoding} patient={patient} />
        </Tabs.Panel>
        <Tabs.Panel value="bmi">
          <ObservationList code={bmiCoding} patient={patient} />
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}

interface ObservationListProps {
  code: Coding;
  patient: Patient;
}

function ObservationList({ code, patient }: ObservationListProps): JSX.Element {
  return <div>Observation list for {code.display}</div>;
}

