import { Paper, Title, Text, Stack, Group, Button, Table, Badge, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Questionnaire } from '@medplum/fhirtypes';
import { Document, Loading, useMedplum } from '@medplum/react';
import { IconPlus, IconEdit, IconTrash, IconFileText } from '@tabler/icons-react';
import { JSX, useState, useEffect } from 'react';
import { getNoteTemplates, initializeDefaultTemplates } from '../../utils/noteTemplates';
import { EditNoteTemplateModal } from '../../components/admin/EditNoteTemplateModal';
import { BreadcrumbNav } from '../../components/shared/BreadcrumbNav';

export function NoteTemplatesPage(): JSX.Element {
  const medplum = useMedplum();
  const [templates, setTemplates] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Questionnaire | null>(null);
  const [initializing, setInitializing] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    const result = await getNoteTemplates(medplum);
    setTemplates(result);
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, [medplum]);

  const handleInitializeDefaults = async () => {
    setInitializing(true);
    try {
      await initializeDefaultTemplates(medplum);
      await loadTemplates();
      notifications.show({
        title: 'Success',
        message: 'Default templates initialized successfully!',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to initialize templates',
        color: 'red',
      });
    } finally {
      setInitializing(false);
    }
  };

  const handleEdit = (template: Questionnaire) => {
    setSelectedTemplate(template);
    setEditModalOpen(true);
  };

  const handleNew = () => {
    setSelectedTemplate(null);
    setEditModalOpen(true);
  };

  const handleDelete = async (template: Questionnaire) => {
    if (!template.id) return;
    
    if (confirm(`Are you sure you want to delete the template "${template.title}"?`)) {
      try {
        await medplum.deleteResource('Questionnaire', template.id);
        await loadTemplates();
        notifications.show({
          title: 'Success',
          message: 'Template deleted successfully',
          color: 'green',
        });
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete template',
          color: 'red',
        });
      }
    }
  };

  const handleModalClose = () => {
    setEditModalOpen(false);
    setSelectedTemplate(null);
    loadTemplates();
  };

  return (
    <Document>
      <BreadcrumbNav />
      
      <EditNoteTemplateModal
        opened={editModalOpen}
        onClose={handleModalClose}
        template={selectedTemplate}
      />

      <Paper shadow="sm" p="lg" withBorder style={{ marginTop: 0 }}>
        <Group justify="space-between" mb="lg">
          <div>
            <Title order={2}>
              <Group gap="xs">
                <IconFileText size={28} />
                Clinical Note Templates
              </Group>
            </Title>
            <Text size="sm" c="dimmed" mt="xs">
              Manage templates for clinical documentation
            </Text>
          </div>
          <Group>
            {templates.length === 0 && (
              <Button
                variant="light"
                onClick={handleInitializeDefaults}
                loading={initializing}
              >
                Initialize Default Templates
              </Button>
            )}
            <Button leftSection={<IconPlus size={16} />} onClick={handleNew}>
              New Template
            </Button>
          </Group>
        </Group>

        {loading ? (
          <Loading />
        ) : templates.length === 0 ? (
          <Paper p="xl" withBorder bg="gray.0">
            <Stack align="center" gap="md">
              <IconFileText size={48} style={{ color: '#adb5bd' }} />
              <div style={{ textAlign: 'center' }}>
                <Text size="lg" fw={500} mb="xs">
                  No Templates Found
                </Text>
                <Text size="sm" c="dimmed" mb="md">
                  Initialize the default template library to get started
                </Text>
                <Button
                  onClick={handleInitializeDefaults}
                  loading={initializing}
                  leftSection={<IconPlus size={16} />}
                >
                  Initialize Default Templates
                </Button>
              </div>
            </Stack>
          </Paper>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Template Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Fields</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {templates.map((template) => (
                <Table.Tr key={template.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {template.title}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {template.description || '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{template.item?.length || 0} fields</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={template.status === 'active' ? 'green' : 'gray'}
                      variant="light"
                      size="sm"
                    >
                      {template.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleEdit(template)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(template)}
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

