import { Modal, TextInput, Button, Group, Stack, Textarea, NumberInput, ColorInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMedplum } from '@medplum/react';
import { IconCheck } from '@tabler/icons-react';
import { JSX, useState, useEffect } from 'react';
import { AppointmentTypeDefinition, saveAppointmentType } from '../../utils/appointmentTypes';
import { getPriceFromResource } from '../../utils/billing';

interface EditAppointmentTypeModalProps {
  opened: boolean;
  onClose: () => void;
  appointmentType: AppointmentTypeDefinition | null;
}

export function EditAppointmentTypeModal({ 
  opened, 
  onClose, 
  appointmentType 
}: EditAppointmentTypeModalProps): JSX.Element {
  const medplum = useMedplum();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    display: '',
    duration: 30,
    description: '',
    color: '#2196F3',
    visitFee: 0,
  });

  useEffect(() => {
    if (appointmentType) {
      setFormData({
        code: appointmentType.code,
        display: appointmentType.display,
        duration: appointmentType.duration,
        description: appointmentType.description || '',
        color: appointmentType.color || '#2196F3',
        visitFee: appointmentType.visitFee || 0,
      });
    } else {
      setFormData({
        code: '',
        display: '',
        duration: 30,
        description: '',
        color: '#2196F3',
        visitFee: 0,
      });
    }
  }, [appointmentType, opened]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await saveAppointmentType(medplum, formData);
      notifications.show({
        title: 'Success',
        message: 'Appointment type saved successfully!',
        color: 'green',
      });
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save appointment type. Please try again.',
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
      title={appointmentType ? 'Edit Appointment Type' : 'Create Appointment Type'}
      size="md"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Code"
            placeholder="new-patient"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.currentTarget.value.toLowerCase().replace(/\s+/g, '-') })}
            description="Unique identifier (lowercase, use hyphens)"
            disabled={!!appointmentType} // Can't change code after creation
          />

          <TextInput
            label="Display Name"
            placeholder="New Patient Visit"
            required
            value={formData.display}
            onChange={(e) => setFormData({ ...formData, display: e.currentTarget.value })}
          />

          <NumberInput
            label="Duration (minutes)"
            placeholder="30"
            required
            min={5}
            max={480}
            step={5}
            value={formData.duration}
            onChange={(value) => setFormData({ ...formData, duration: Number(value) || 30 })}
          />

          <Textarea
            label="Description"
            placeholder="Brief description of this appointment type"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
          />

          <ColorInput
            label="Calendar Color"
            placeholder="Pick a color"
            value={formData.color}
            onChange={(value) => setFormData({ ...formData, color: value })}
            format="hex"
            swatches={[
              '#4CAF50', '#2196F3', '#9C27B0', '#00BCD4', '#FF5722',
              '#FF9800', '#E91E63', '#607D8B', '#8BC34A', '#3F51B5',
              '#795548', '#009688', '#FFC107', '#F44336', '#673AB7',
            ]}
          />

          <NumberInput
            label="Visit Fee ($)"
            value={formData.visitFee}
            onChange={(value) => setFormData({ ...formData, visitFee: Number(value) || 0 })}
            min={0}
            decimalScale={2}
            prefix="$"
            placeholder="0.00"
            description="Fee charged for this type of visit"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} leftSection={<IconCheck size={16} />}>
              Save Appointment Type
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

