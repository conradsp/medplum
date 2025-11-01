import { useState, useEffect, useCallback, JSX } from 'react';
import { Container, Title, Button, Table, Group, Stack, Text, Badge } from '@mantine/core';
import { IconPlus, IconRefresh, IconEdit, IconTrash } from '@tabler/icons-react';
import { useMedplum } from '@medplum/react';
import { ActivityDefinition } from '@medplum/fhirtypes';
import { notifications } from '@mantine/notifications';
import { getLabTests, initializeDefaultLabTests, deleteLabTest } from '../../utils/labTests';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav';
import { EditLabTestModal } from '../../components/admin/EditLabTestModal';
import { getPriceFromResource } from '../../utils/billing';

export function LabTestsPage(): JSX.Element {
  const medplum = useMedplum();
  const [labTests, setLabTests] = useState<ActivityDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ActivityDefinition | null>(null);

  const loadLabTests = useCallback(async (): Promise<void> => {
    setLoading(true);
    const tests = await getLabTests(medplum);
    setLabTests(tests);
    setLoading(false);
  }, [medplum]);

  useEffect(() => {
    loadLabTests().catch(() => {});
  }, [loadLabTests]);

  const handleInitializeDefaults = async (): Promise<void> => {
    try {
      await initializeDefaultLabTests(medplum);
      notifications.show({
        title: 'Success',
        message: 'Default lab tests initialized successfully',
        color: 'green',
      });
      await loadLabTests();
    } catch (_error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to initialize default lab tests',
        color: 'red',
      });
    }
  };

  const handleEdit = (test: ActivityDefinition): void => {
    setSelectedTest(test);
    setEditModalOpen(true);
  };

  const handleCreate = (): void => {
    setSelectedTest(null);
    setEditModalOpen(true);
  };

  const handleDelete = async (test: ActivityDefinition): Promise<void> => {
    if (!test.identifier?.[0]?.value) {
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${test.title}"?`)) {
      try {
        await deleteLabTest(medplum, test.identifier[0].value);
        notifications.show({
          title: 'Success',
          message: 'Lab test deleted successfully',
          color: 'green',
        });
        await loadLabTests();
      } catch (_error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete lab test',
          color: 'red',
        });
      }
    }
  };

  const handleModalClose = async (saved: boolean): Promise<void> => {
    setEditModalOpen(false);
    setSelectedTest(null);
    if (saved) {
      await loadLabTests();
    }
  };

  const getCategory = (test: ActivityDefinition): string => {
    const categoryExt = test.extension?.find(e => e.url === 'category');
    return categoryExt?.valueString || 'Uncategorized';
  };

  const getSpecimenType = (test: ActivityDefinition): string => {
    const specimenExt = test.extension?.find(e => e.url === 'specimenType');
    return specimenExt?.valueString || 'N/A';
  };

  // Group tests by category
  const groupedTests = labTests.reduce<Record<string, ActivityDefinition[]>>((acc, test) => {
    const category = getCategory(test);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(test);
    return acc;
  }, {});

  return (
    <Container size="xl" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <BreadcrumbNav />
      
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Lab Tests Catalog</Title>
          <Text c="dimmed" size="sm">Manage available laboratory tests</Text>
        </div>
        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={handleInitializeDefaults}
          >
            Initialize Defaults
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreate}
          >
            Add Lab Test
          </Button>
        </Group>
      </Group>

      {loading && <Text>Loading...</Text>}
      {!loading && labTests.length === 0 && (
        <Stack align="center" py="xl">
          <Text c="dimmed">No lab tests configured</Text>
          <Button onClick={handleInitializeDefaults}>Initialize Default Lab Tests</Button>
        </Stack>
      )}
      {!loading && labTests.length > 0 && (
        <Stack gap="xl">
          {Object.entries(groupedTests).sort().map(([category, tests]) => (
            <div key={category}>
              <Title order={3} size="h4" mb="md">
                {category}
                <Badge ml="sm" size="lg" variant="light">{tests.length}</Badge>
              </Title>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Test Name</Table.Th>
                    <Table.Th>LOINC Code</Table.Th>
                    <Table.Th>Specimen Type</Table.Th>
                    <Table.Th>Price</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th style={{ width: '80px' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {tests.map((test) => (
                    <Table.Tr key={test.id}>
                      <Table.Td>
                        <Text fw={500}>{test.title}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {test.code?.coding?.[0]?.code || 'N/A'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{getSpecimenType(test)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          ${(getPriceFromResource(test) || 0).toFixed(2)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed" lineClamp={1}>
                          {test.description || '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconEdit size={14} />}
                            color="blue"
                            onClick={() => handleEdit(test)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={() => handleDelete(test)}
                          >
                            Delete
                          </Button>
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          ))}
        </Stack>
      )}

      <EditLabTestModal
        opened={editModalOpen}
        onClose={handleModalClose}
        test={selectedTest}
      />
    </Container>
  );
}

