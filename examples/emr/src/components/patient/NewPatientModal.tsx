import { Modal, Button, TextInput, Select, Stack, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMedplum } from '@medplum/react';
import { Patient } from '@medplum/fhirtypes';
import { JSX, useState } from 'react';
import { useNavigate } from 'react-router';

interface NewPatientModalProps {
  opened: boolean;
  onClose: () => void;
}

export function NewPatientModal({ opened, onClose }: NewPatientModalProps): JSX.Element {
  const medplum = useMedplum();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    email: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      const patient: Patient = {
        resourceType: 'Patient',
        name: [
          {
            given: [formData.firstName],
            family: formData.lastName,
            use: 'official',
          },
        ],
        birthDate: formData.birthDate,
        gender: formData.gender as 'male' | 'female' | 'other' | 'unknown',
        telecom: [
          ...(formData.email ? [{
            system: 'email' as const,
            value: formData.email,
            use: 'home' as const,
          }] : []),
          ...(formData.phone ? [{
            system: 'phone' as const,
            value: formData.phone,
            use: 'mobile' as const,
          }] : []),
        ],
        address: formData.addressLine ? [
          {
            line: [formData.addressLine],
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            use: 'home',
          },
        ] : undefined,
        active: true,
      };

      const created = await medplum.createResource(patient);
      
      onClose();
      navigate(`/patient/${created.id}`);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create patient. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Patient" size="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="First Name"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <TextInput
              label="Last Name"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Date of Birth"
              type="date"
              required
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
            <Select
              label="Gender"
              required
              data={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
                { value: 'unknown', label: 'Unknown' },
              ]}
              value={formData.gender}
              onChange={(value) => setFormData({ ...formData, gender: value || '' })}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextInput
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </Group>

          <TextInput
            label="Address Line"
            value={formData.addressLine}
            onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
          />

          <Group grow>
            <TextInput
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <TextInput
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <TextInput
              label="Postal Code"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Patient
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

