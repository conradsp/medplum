import { JSX, useState, useEffect } from 'react';
import { Container, Title, Text, Button, Group, Stack, Table, Badge, ActionIcon, Modal, TextInput, Select } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useMedplum } from '@medplum/react';
import { ValueSetExpansionContains } from '@medplum/fhirtypes';
import { notifications } from '@mantine/notifications';
import { getAllDiagnosisCodes, initializeDefaultDiagnosisCodes, addDiagnosisCode, updateDiagnosisCode, deleteDiagnosisCode } from '../../utils/diagnosisCodes';

export function DiagnosisCodesPage(): JSX.Element {
  const medplum = useMedplum();
  const [codes, setCodes] = useState<ValueSetExpansionContains[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<ValueSetExpansionContains | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    display: '',
    system: 'http://hl7.org/fhir/sid/icd-10',
  });

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const allCodes = await getAllDiagnosisCodes(medplum);
      setCodes(allCodes);
    } catch (error) {
      logger.error('Failed to load diagnosis codes', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load diagnosis codes',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      await initializeDefaultDiagnosisCodes(medplum);
      notifications.show({
        title: 'Success',
        message: 'Default ICD-10 codes initialized',
        color: 'green',
      });
      loadCodes();
    } catch (error) {
      logger.error('Failed to initialize defaults', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to initialize default codes',
        color: 'red',
      });
    }
  };

  const openCreateModal = () => {
    setEditingCode(null);
    setFormData({
      code: '',
      display: '',
      system: 'http://hl7.org/fhir/sid/icd-10',
    });
    setModalOpen(true);
  };

  const openEditModal = (code: ValueSetExpansionContains) => {
    setEditingCode(code);
    setFormData({
      code: code.code || '',
      display: code.display || '',
      system: code.system || 'http://hl7.org/fhir/sid/icd-10',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.display) {
      notifications.show({
        title: 'Validation Error',
        message: 'Code and display are required',
        color: 'yellow',
      });
      return;
    }

    try {
      if (editingCode) {
        await updateDiagnosisCode(
          medplum,
          editingCode.code!,
          editingCode.system!,
          formData.code,
          formData.display,
          formData.system
        );
        notifications.show({
          title: 'Success',
          message: 'Diagnosis code updated',
          color: 'green',
        });
      } else {
        await addDiagnosisCode(medplum, formData.code, formData.display, formData.system);
        notifications.show({
          title: 'Success',
          message: 'Diagnosis code added',
          color: 'green',
        });
      }
      setModalOpen(false);
      loadCodes();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to save diagnosis code',
        color: 'red',
      });
    }
  };

  const handleDelete = async (code: ValueSetExpansionContains) => {
    if (!confirm(`Delete diagnosis code ${code.code}?`)) {
      return;
    }

    try {
      await deleteDiagnosisCode(medplum, code.code!, code.system!);
      notifications.show({
        title: 'Success',
        message: 'Diagnosis code deleted',
        color: 'green',
      });
      loadCodes();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete diagnosis code',
        color: 'red',
      });
    }
  };

  const getSystemBadgeColor = (system?: string) => {
    if (system === 'http://hl7.org/fhir/sid/icd-10') return 'blue';
    if (system === 'http://snomed.info/sct') return 'green';
    return 'gray';
  };

  const getSystemLabel = (system?: string) => {
    if (system === 'http://hl7.org/fhir/sid/icd-10') return 'ICD-10';
    if (system === 'http://snomed.info/sct') return 'SNOMED';
    return 'Custom';
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={2}>Diagnosis Codes</Title>
            <Text c="dimmed">Manage ICD-10 and custom diagnosis codes</Text>
          </div>
          <Group>
            {codes.length === 0 && (
              <Button onClick={handleInitializeDefaults} loading={loading}>
                Initialize ICD-10 Defaults
              </Button>
            )}
            <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
              Add Diagnosis Code
            </Button>
          </Group>
        </Group>

        {loading ? (
          <Text>Loading...</Text>
        ) : codes.length === 0 ? (
          <Text c="dimmed">
            No diagnosis codes configured. Click "Initialize ICD-10 Defaults" to load common diagnoses.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Code</Table.Th>
                <Table.Th>Display</Table.Th>
                <Table.Th>System</Table.Th>
                <Table.Th style={{ width: '100px' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {codes.map((code, index) => (
                <Table.Tr key={`${code.system}-${code.code}-${index}`}>
                  <Table.Td>
                    <Text fw={600}>{code.code}</Text>
                  </Table.Td>
                  <Table.Td>{code.display}</Table.Td>
                  <Table.Td>
                    <Badge color={getSystemBadgeColor(code.system)}>
                      {getSystemLabel(code.system)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => openEditModal(code)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(code)}
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
      </Stack>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCode ? 'Edit Diagnosis Code' : 'Add Diagnosis Code'}
      >
        <Stack gap="md">
          <Select
            label="Code System"
            data={[
              { value: 'http://hl7.org/fhir/sid/icd-10', label: 'ICD-10' },
              { value: 'http://snomed.info/sct', label: 'SNOMED CT' },
              { value: 'custom', label: 'Custom' },
            ]}
            value={formData.system}
            onChange={(value) => setFormData({ ...formData, system: value || 'http://hl7.org/fhir/sid/icd-10' })}
            required
          />

          <TextInput
            label="Code"
            placeholder="E.g., E11.9"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.currentTarget.value })}
            required
          />

          <TextInput
            label="Display Name"
            placeholder="E.g., Type 2 diabetes mellitus without complications"
            value={formData.display}
            onChange={(e) => setFormData({ ...formData, display: e.currentTarget.value })}
            required
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCode ? 'Update' : 'Add'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

