import { useState, useEffect, JSX } from 'react';
import { Container, Title, Button, Table, Group, Stack, Text, Badge, ActionIcon, Menu } from '@mantine/core';
import { IconPlus, IconRefresh, IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import { useMedplum } from '@medplum/react';
import { ActivityDefinition } from '@medplum/fhirtypes';
import { notifications } from '@mantine/notifications';
import { getImagingTests, initializeDefaultImagingTests, deleteImagingTest } from '../../utils/imagingTests';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav';
import { EditImagingTestModal } from '../../components/admin/EditImagingTestModal';
import { getPriceFromResource } from '../../utils/billing';

export function ImagingTestsPage(): JSX.Element {
  const medplum = useMedplum();
  const [imagingTests, setImagingTests] = useState<ActivityDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ActivityDefinition | null>(null);

  const loadImagingTests = async () => {
    setLoading(true);
    const tests = await getImagingTests(medplum);
    setImagingTests(tests);
    setLoading(false);
  };

  useEffect(() => {
    loadImagingTests();
  }, []);

  const handleInitializeDefaults = async () => {
    try {
      await initializeDefaultImagingTests(medplum);
      notifications.show({
        title: 'Success',
        message: 'Default imaging tests initialized successfully',
        color: 'green',
      });
      await loadImagingTests();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to initialize default imaging tests',
        color: 'red',
      });
    }
  };

  const handleEdit = (test: ActivityDefinition) => {
    setSelectedTest(test);
    setEditModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedTest(null);
    setEditModalOpen(true);
  };

  const handleDelete = async (test: ActivityDefinition) => {
    if (!test.identifier || !test.identifier[0]?.value) {
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${test.title}"?`)) {
      try {
        await deleteImagingTest(medplum, test.identifier[0].value);
        notifications.show({
          title: 'Success',
          message: 'Imaging test deleted successfully',
          color: 'green',
        });
        await loadImagingTests();
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete imaging test',
          color: 'red',
        });
      }
    }
  };

  const handleModalClose = async (saved: boolean) => {
    setEditModalOpen(false);
    setSelectedTest(null);
    if (saved) {
      await loadImagingTests();
    }
  };

  const getCategory = (test: ActivityDefinition): string => {
    const categoryExt = test.extension?.find(e => e.url === 'category');
    return categoryExt?.valueString || 'Uncategorized';
  };

  const getBodyPart = (test: ActivityDefinition): string => {
    const bodyPartExt = test.extension?.find(e => e.url === 'bodyPart');
    return bodyPartExt?.valueString || 'N/A';
  };

  const getModality = (test: ActivityDefinition): string => {
    const modalityExt = test.extension?.find(e => e.url === 'modality');
    return modalityExt?.valueString || 'N/A';
  };

  // Group tests by category
  const testsByCategory = imagingTests.reduce((acc, test) => {
    const category = getCategory(test);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(test);
    return acc;
  }, {} as Record<string, ActivityDefinition[]>);

  return (
    <Container size="xl" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <BreadcrumbNav />
      
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Imaging Tests Catalog</Title>
          <Text c="dimmed" size="sm">Manage available imaging studies</Text>
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
            Add Imaging Test
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Text>Loading...</Text>
      ) : imagingTests.length === 0 ? (
        <Stack align="center" py="xl">
          <Text c="dimmed">No imaging tests configured</Text>
          <Button onClick={handleInitializeDefaults}>Initialize Default Imaging Tests</Button>
        </Stack>
      ) : (
        <Stack gap="xl">
          {Object.entries(testsByCategory).sort().map(([category, tests]) => (
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
                    <Table.Th>Body Part</Table.Th>
                    <Table.Th>Modality</Table.Th>
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
                        <Text size="sm">{getBodyPart(test)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" variant="light">{getModality(test)}</Badge>
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
                        <Menu position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => handleEdit(test)}
                            >
                              Edit
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color="red"
                              onClick={() => handleDelete(test)}
                            >
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          ))}
        </Stack>
      )}

      <EditImagingTestModal
        opened={editModalOpen}
        onClose={handleModalClose}
        test={selectedTest}
      />
    </Container>
  );
}

