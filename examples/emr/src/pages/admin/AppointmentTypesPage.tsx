import { Paper, Title, Text, Stack, Group, Button, Table, Badge, ActionIcon, ColorSwatch } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Document, Loading, useMedplum } from '@medplum/react';
import { IconPlus, IconEdit, IconTrash, IconClock, IconCalendar } from '@tabler/icons-react';
import { JSX, useState, useEffect } from 'react';
import { 
  getAppointmentTypes, 
  initializeAppointmentTypes,
  deleteAppointmentType,
  AppointmentTypeDefinition 
} from '../../utils/appointmentTypes';
import { EditAppointmentTypeModal } from '../../components/admin/EditAppointmentTypeModal';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav';
import { getPriceFromResource } from '../../utils/billing';

export function AppointmentTypesPage(): JSX.Element {
  const medplum = useMedplum();
  const [types, setTypes] = useState<AppointmentTypeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<AppointmentTypeDefinition | null>(null);
  const [initializing, setInitializing] = useState(false);

  const loadTypes = async () => {
    setLoading(true);
    const result = await getAppointmentTypes(medplum);
    setTypes(result);
    setLoading(false);
  };

  useEffect(() => {
    loadTypes();
  }, [medplum]);

  const handleInitializeDefaults = async () => {
    setInitializing(true);
    try {
      await initializeAppointmentTypes(medplum);
      await loadTypes();
      notifications.show({
        title: 'Success',
        message: 'Default appointment types initialized successfully!',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to initialize appointment types',
        color: 'red',
      });
    } finally {
      setInitializing(false);
    }
  };

  const handleEdit = (type: AppointmentTypeDefinition) => {
    setSelectedType(type);
    setEditModalOpen(true);
  };

  const handleNew = () => {
    setSelectedType(null);
    setEditModalOpen(true);
  };

  const handleDelete = async (type: AppointmentTypeDefinition) => {
    if (confirm(`Are you sure you want to delete the appointment type "${type.display}"?`)) {
      try {
        await deleteAppointmentType(medplum, type.code);
        await loadTypes();
        notifications.show({
          title: 'Success',
          message: 'Appointment type deleted successfully',
          color: 'green',
        });
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete appointment type',
          color: 'red',
        });
      }
    }
  };

  const handleModalClose = () => {
    setEditModalOpen(false);
    setSelectedType(null);
    loadTypes();
  };

  return (
    <Document>
      <BreadcrumbNav />
      
      <EditAppointmentTypeModal
        opened={editModalOpen}
        onClose={handleModalClose}
        appointmentType={selectedType}
      />

      <Paper shadow="sm" p="lg" withBorder style={{ marginTop: 0 }}>
        <Group justify="space-between" mb="lg">
          <div>
            <Title order={2}>
              <Group gap="xs">
                <IconCalendar size={28} />
                Appointment Types
              </Group>
            </Title>
            <Text size="sm" c="dimmed" mt="xs">
              Manage appointment types and their durations for scheduling
            </Text>
          </div>
          <Group>
            {types.length === 0 && (
              <Button
                variant="light"
                onClick={handleInitializeDefaults}
                loading={initializing}
              >
                Initialize Default Types
              </Button>
            )}
            <Button leftSection={<IconPlus size={16} />} onClick={handleNew}>
              New Appointment Type
            </Button>
          </Group>
        </Group>

        {loading ? (
          <Loading />
        ) : types.length === 0 ? (
          <Paper p="xl" withBorder bg="gray.0">
            <Stack align="center" gap="md">
              <IconCalendar size={48} style={{ color: '#adb5bd' }} />
              <div style={{ textAlign: 'center' }}>
                <Text size="lg" fw={500} mb="xs">
                  No Appointment Types Found
                </Text>
                <Text size="sm" c="dimmed" mb="md">
                  Initialize the default appointment types to get started with scheduling
                </Text>
                <Button
                  onClick={handleInitializeDefaults}
                  loading={initializing}
                  leftSection={<IconPlus size={16} />}
                >
                  Initialize Default Types
                </Button>
              </div>
            </Stack>
          </Paper>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Color</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Duration</Table.Th>
                <Table.Th>Visit Fee</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {types.map((type) => (
                <Table.Tr key={type.code}>
                  <Table.Td>
                    <ColorSwatch color={type.color || '#2196F3'} size={24} />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {type.display}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" size="sm">
                      {type.code}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <IconClock size={16} style={{ color: '#666' }} />
                      <Text size="sm">{type.duration} min</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      ${(type.visitFee || 0).toFixed(2)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" lineClamp={1}>
                      {type.description || '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleEdit(type)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(type)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Document>
  );
}

