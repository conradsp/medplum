import { useState, useEffect, JSX } from 'react';
import { Container, Title, Button, Table, Group, Stack, Text, Badge, ActionIcon, Menu } from '@mantine/core';
import { IconPlus, IconRefresh, IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import { useMedplum } from '@medplum/react';
import { Organization } from '@medplum/fhirtypes';
import { notifications } from '@mantine/notifications';
import { getDiagnosticProviders, initializeDefaultDiagnosticProviders, deleteDiagnosticProvider } from '../../utils/diagnosticProviders';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav';
import { EditDiagnosticProviderModal } from '../../components/admin/EditDiagnosticProviderModal';

export function DiagnosticProvidersPage(): JSX.Element {
  const medplum = useMedplum();
  const [providers, setProviders] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Organization | null>(null);

  const loadProviders = async () => {
    setLoading(true);
    const provs = await getDiagnosticProviders(medplum);
    setProviders(provs);
    setLoading(false);
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleInitializeDefaults = async () => {
    try {
      await initializeDefaultDiagnosticProviders(medplum);
      notifications.show({
        title: 'Success',
        message: 'Default diagnostic providers initialized successfully',
        color: 'green',
      });
      await loadProviders();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to initialize default providers',
        color: 'red',
      });
    }
  };

  const handleEdit = (provider: Organization) => {
    setSelectedProvider(provider);
    setEditModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProvider(null);
    setEditModalOpen(true);
  };

  const handleDelete = async (provider: Organization) => {
    if (!provider.identifier || !provider.identifier[0]?.value) {
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${provider.name}"?`)) {
      try {
        await deleteDiagnosticProvider(medplum, provider.identifier[0].value);
        notifications.show({
          title: 'Success',
          message: 'Diagnostic provider deleted successfully',
          color: 'green',
        });
        await loadProviders();
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete provider',
          color: 'red',
        });
      }
    }
  };

  const handleModalClose = async (saved: boolean) => {
    setEditModalOpen(false);
    setSelectedProvider(null);
    if (saved) {
      await loadProviders();
    }
  };

  const getProviderType = (provider: Organization): string => {
    const typeExt = provider.extension?.find(e => e.url === 'diagnosticType');
    return typeExt?.valueString || 'unknown';
  };

  const getProviderTypeColor = (type: string): string => {
    switch (type) {
      case 'lab':
        return 'blue';
      case 'imaging':
        return 'grape';
      case 'both':
        return 'teal';
      default:
        return 'gray';
    }
  };

  const getProviderTypeLabel = (type: string): string => {
    switch (type) {
      case 'lab':
        return 'Laboratory';
      case 'imaging':
        return 'Imaging';
      case 'both':
        return 'Lab & Imaging';
      default:
        return 'Unknown';
    }
  };

  return (
    <Container size="xl" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <BreadcrumbNav />
      
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Diagnostic Providers</Title>
          <Text c="dimmed" size="sm">Manage laboratory and imaging service providers</Text>
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
            Add Provider
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Text>Loading...</Text>
      ) : providers.length === 0 ? (
        <Stack align="center" py="xl">
          <Text c="dimmed">No diagnostic providers configured</Text>
          <Button onClick={handleInitializeDefaults}>Initialize Default Providers</Button>
        </Stack>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Provider Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Website</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th style={{ width: '80px' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {providers.map((provider) => {
              const type = getProviderType(provider);
              const phone = provider.telecom?.find(t => t.system === 'phone')?.value;
              const website = provider.telecom?.find(t => t.system === 'url')?.value;

              return (
                <Table.Tr key={provider.id}>
                  <Table.Td>
                    <Text fw={500}>{provider.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getProviderTypeColor(type)}>
                      {getProviderTypeLabel(type)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{phone || '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    {website ? (
                      <Text size="sm" c="blue" style={{ cursor: 'pointer' }} onClick={() => window.open(website, '_blank')}>
                        {website.replace(/^https?:\/\//, '')}
                      </Text>
                    ) : (
                      <Text size="sm">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={provider.active ? 'green' : 'red'}>
                      {provider.active ? 'Active' : 'Inactive'}
                    </Badge>
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
                          onClick={() => handleEdit(provider)}
                        >
                          Edit
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={() => handleDelete(provider)}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}

      <EditDiagnosticProviderModal
        opened={editModalOpen}
        onClose={handleModalClose}
        provider={selectedProvider}
      />
    </Container>
  );
}

