import { Modal, Button, Group, Stack, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Patient, Practitioner } from '@medplum/fhirtypes';
import { useMedplum, Loading, useSearchResources } from '@medplum/react';
import { IconStethoscope } from '@tabler/icons-react';
import { JSX, useState } from 'react';

interface AddPractitionerModalProps {
  opened: boolean;
  onClose: () => void;
  patient: Patient;
  onSuccess?: () => void;
}

export function AddPractitionerModal({ opened, onClose, patient, onSuccess }: AddPractitionerModalProps): JSX.Element {
  const medplum = useMedplum();
  const [loading, setLoading] = useState(false);
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string | null>(null);

  // Load all practitioners
  const [practitioners, practitionersLoading] = useSearchResources('Practitioner', {
    _count: '100',
    _sort: 'name',
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!selectedPractitionerId) {
      notifications.show({
        title: 'Error',
        message: 'Please select a practitioner',
        color: 'red',
      });
      return;
    }

    setLoading(true);

    try {
      const selectedPractitioner = practitioners?.find(p => p.id === selectedPractitionerId);
      
      if (!selectedPractitioner) {
        throw new Error('Practitioner not found');
      }

      // Update patient with general practitioner
      const updatedPatient: Patient = {
        ...patient,
        generalPractitioner: [
          ...(patient.generalPractitioner || []),
          {
            reference: `Practitioner/${selectedPractitionerId}`,
            display: selectedPractitioner.name?.[0]?.text || 
                    [selectedPractitioner.name?.[0]?.given?.[0], selectedPractitioner.name?.[0]?.family]
                      .filter(Boolean).join(' '),
          },
        ],
      };

      await medplum.updateResource(updatedPatient);
      
      setSelectedPractitionerId(null);
      notifications.show({
        title: 'Success',
        message: 'General practitioner assigned successfully!',
        color: 'green',
      });
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to assign practitioner. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const practitionerOptions = practitioners?.map(p => ({
    value: p.id || '',
    label: p.name?.[0]?.text || 
           [p.name?.[0]?.given?.[0], p.name?.[0]?.family].filter(Boolean).join(' ') || 
           'Unknown Practitioner',
  })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="Assign General Practitioner" centered>
      <form onSubmit={handleSubmit}>
        <Stack>
          {practitionersLoading ? (
            <Loading />
          ) : (
            <Select
              label="Select Practitioner"
              placeholder="Choose a practitioner"
              required
              data={practitionerOptions}
              value={selectedPractitionerId}
              onChange={setSelectedPractitionerId}
              searchable
            />
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={loading} 
              leftSection={<IconStethoscope size={16} />}
              disabled={!selectedPractitionerId}
            >
              Assign Practitioner
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

