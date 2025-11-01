import { Modal, TextInput, Button, Group, Stack, Textarea, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Questionnaire, QuestionnaireItem } from '@medplum/fhirtypes';
import { useMedplum, QuestionnaireForm } from '@medplum/react';
import { IconCheck } from '@tabler/icons-react';
import { JSX, useState, useEffect } from 'react';

interface EditNoteTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  template: Questionnaire | null;
}

export function EditNoteTemplateModal({ opened, onClose, template }: EditNoteTemplateModalProps): JSX.Element {
  const medplum = useMedplum();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active' as 'active' | 'draft' | 'retired',
  });
  const [items, setItems] = useState<QuestionnaireItem[]>([]);

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title || '',
        description: template.description || '',
        status: template.status as 'active' | 'draft' | 'retired',
      });
      setItems(template.item || []);
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'active',
      });
      setItems([]);
    }
  }, [template, opened]);

  const handleAddField = () => {
    setItems([
      ...items,
      {
        linkId: `field-${items.length + 1}`,
        text: '',
        type: 'string',
        required: false,
      },
    ]);
  };

  const handleUpdateField = (index: number, field: Partial<QuestionnaireItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...field };
    setItems(newItems);
  };

  const handleRemoveField = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const questionnaire: Questionnaire = {
        resourceType: 'Questionnaire',
        status: formData.status,
        title: formData.title,
        description: formData.description,
        identifier: template?.identifier || [
          {
            system: 'http://medplum.com/note-templates',
            value: `custom-${Date.now()}`,
          },
        ],
        item: items,
      };

      if (template?.id) {
        // Update existing
        await medplum.updateResource({
          ...questionnaire,
          id: template.id,
        });
      } else {
        // Create new
        await medplum.createResource(questionnaire);
      }

      notifications.show({
        title: 'Success',
        message: 'Template saved successfully!',
        color: 'green',
      });
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save template. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={template ? 'Edit Note Template' : 'Create Note Template'}
      size="lg"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Template Name"
            placeholder="SOAP Note"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.currentTarget.value })}
          />

          <Textarea
            label="Description"
            placeholder="Subjective, Objective, Assessment, and Plan documentation"
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
          />

          <Select
            label="Status"
            required
            data={[
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
              { value: 'retired', label: 'Retired' },
            ]}
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value as 'active' | 'draft' | 'retired' })}
          />

          <div>
            <Group justify="space-between" mb="sm">
              <strong>Template Fields</strong>
              <Button size="xs" variant="light" onClick={handleAddField}>
                Add Field
              </Button>
            </Group>

            <Stack gap="sm">
              {items.map((item, index) => (
                <Group key={index} align="flex-start" gap="xs">
                  <TextInput
                    placeholder="Field label"
                    value={item.text}
                    onChange={(e) => handleUpdateField(index, { text: e.currentTarget.value })}
                    style={{ flex: 1 }}
                    size="sm"
                  />
                  <Select
                    placeholder="Type"
                    data={[
                      { value: 'string', label: 'Short Text' },
                      { value: 'text', label: 'Long Text' },
                      { value: 'boolean', label: 'Yes/No' },
                      { value: 'date', label: 'Date' },
                      { value: 'time', label: 'Time' },
                      { value: 'dateTime', label: 'Date & Time' },
                    ]}
                    value={item.type}
                    onChange={(value) => handleUpdateField(index, { type: value as any })}
                    style={{ width: 140 }}
                    size="sm"
                  />
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    onClick={() => handleRemoveField(index)}
                  >
                    Remove
                  </Button>
                </Group>
              ))}
            </Stack>
          </div>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} leftSection={<IconCheck size={16} />}>
              Save Template
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

