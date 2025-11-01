import { Paper, Title, Table, Text, Badge, Stack, Group, Button, Tabs } from '@mantine/core';
import { formatDateTime } from '@medplum/core';
import { Practitioner, Patient } from '@medplum/fhirtypes';
import { Document, Loading, useSearchResources } from '@medplum/react';
import { IconUser, IconStethoscope, IconPlus } from '@tabler/icons-react';
import { JSX, useState } from 'react';
import { NewProviderModal } from '../../components/admin/NewProviderModal';

export function ManageUsersPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('practitioners');
  const [newProviderModalOpen, setNewProviderModalOpen] = useState(false);
  
  const [practitioners, practitionersLoading] = useSearchResources('Practitioner', {
    _count: '50',
    _sort: '-_lastUpdated',
  });

  const [patients, patientsLoading] = useSearchResources('Patient', {
    _count: '50',
    _sort: '-_lastUpdated',
  });

  return (
    <Document>
      <NewProviderModal opened={newProviderModalOpen} onClose={() => setNewProviderModalOpen(false)} />
      
      <Paper shadow="sm" p="lg" withBorder style={{ marginTop: 0 }}>
        <Group justify="space-between" mb="lg">
          <div>
            <Title order={2}>Manage Users</Title>
            <Text size="sm" c="dimmed">
              View and manage all users in the system
            </Text>
          </div>
          <Button 
            leftSection={<IconPlus size={16} />}
            onClick={() => setNewProviderModalOpen(true)}
          >
            Add Provider
          </Button>
        </Group>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'practitioners')}>
          <Tabs.List>
            <Tabs.Tab value="practitioners" leftSection={<IconStethoscope size={16} />}>
              Practitioners {practitioners && `(${practitioners.length})`}
            </Tabs.Tab>
            <Tabs.Tab value="patients" leftSection={<IconUser size={16} />}>
              Patients {patients && `(${patients.length})`}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="practitioners" pt="md">
            {practitionersLoading ? (
              <Loading />
            ) : !practitioners || practitioners.length === 0 ? (
              <Text size="md" c="dimmed" ta="center" py="xl">
                No practitioners found
              </Text>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Phone</Table.Th>
                    <Table.Th>NPI</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Last Updated</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {practitioners.map((practitioner) => {
                    const name =
                      practitioner.name?.[0]?.text ||
                      [practitioner.name?.[0]?.given?.[0], practitioner.name?.[0]?.family]
                        .filter(Boolean)
                        .join(' ') ||
                      'Unknown';
                    const email = practitioner.telecom?.find(t => t.system === 'email')?.value;
                    const phone = practitioner.telecom?.find(t => t.system === 'phone')?.value;
                    const npi = practitioner.identifier?.find(
                      id => id.system === 'http://hl7.org/fhir/sid/us-npi'
                    )?.value;

                    return (
                      <Table.Tr key={practitioner.id}>
                        <Table.Td>
                          <Group gap="xs">
                            <IconStethoscope size={16} style={{ color: '#228be6' }} />
                            <Text size="sm" fw={500}>
                              {name}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{email || '-'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{phone || '-'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{npi || '-'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={practitioner.active ? 'green' : 'gray'}
                            variant="light"
                            size="sm"
                          >
                            {practitioner.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {practitioner.meta?.lastUpdated
                              ? formatDateTime(practitioner.meta.lastUpdated)
                              : '-'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="patients" pt="md">
            {patientsLoading ? (
              <Loading />
            ) : !patients || patients.length === 0 ? (
              <Text size="md" c="dimmed" ta="center" py="xl">
                No patients found
              </Text>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Gender</Table.Th>
                    <Table.Th>Date of Birth</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Phone</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {patients.map((patient) => {
                    const name =
                      patient.name?.[0]?.text ||
                      [patient.name?.[0]?.given?.[0], patient.name?.[0]?.family]
                        .filter(Boolean)
                        .join(' ') ||
                      'Unknown';
                    const email = patient.telecom?.find(t => t.system === 'email')?.value;
                    const phone = patient.telecom?.find(t => t.system === 'phone')?.value;

                    return (
                      <Table.Tr key={patient.id}>
                        <Table.Td>
                          <Group gap="xs">
                            <IconUser size={16} style={{ color: '#666' }} />
                            <Text size="sm" fw={500}>
                              {name}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" tt="capitalize">
                            {patient.gender || '-'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{patient.birthDate || '-'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{email || '-'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{phone || '-'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={patient.active ? 'green' : 'gray'}
                            variant="light"
                            size="sm"
                          >
                            {patient.active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Document>
  );
}

