import { Modal, TextInput, Button, Group, Stack, Select, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Practitioner, HumanName, ContactPoint, Address } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { IconUserPlus } from '@tabler/icons-react';
import { JSX, useState } from 'react';

interface NewProviderModalProps {
  opened: boolean;
  onClose: () => void;
}

export function NewProviderModal({ opened, onClose }: NewProviderModalProps): JSX.Element {
  const medplum = useMedplum();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    email: '',
    phone: '',
    specialty: '',
    qualification: '',
    npi: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const handleChange = (field: string, value: string | null): void => {
    setFormData((prev) => ({ ...prev, [field]: value || '' }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      const name: HumanName = {
        given: [formData.firstName],
        family: formData.lastName,
        text: `${formData.firstName} ${formData.lastName}`,
        use: 'official',
      };

      const telecom: ContactPoint[] = [];
      if (formData.email) {
        telecom.push({ system: 'email', value: formData.email, use: 'work' });
      }
      if (formData.phone) {
        telecom.push({ system: 'phone', value: formData.phone, use: 'work' });
      }

      const address: Address | undefined = formData.addressLine ? {
        line: [formData.addressLine],
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: 'US',
        use: 'work',
      } : undefined;

      const practitioner: Practitioner = {
        resourceType: 'Practitioner',
        name: [name],
        telecom: telecom.length > 0 ? telecom : undefined,
        address: address ? [address] : undefined,
        gender: formData.gender as 'male' | 'female' | 'other' | 'unknown' || undefined,
        active: true,
        identifier: formData.npi ? [
          {
            system: 'http://hl7.org/fhir/sid/us-npi',
            value: formData.npi,
          },
        ] : undefined,
        qualification: formData.qualification ? [
          {
            code: {
              text: formData.qualification,
            },
          },
        ] : undefined,
      };

      const createdPractitioner = await medplum.createResource(practitioner);
      // Invite provider to set up their account
      if (formData.email) {
        const project = medplum.getProject();
        if (project?.id) {
          await medplum.invite(
            project.id,
            {
              resourceType: 'Practitioner',
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              // Optionally: password, sendEmail, membership, etc.
            }
          );
        }
      }

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        gender: '',
        email: '',
        phone: '',
        specialty: '',
        qualification: '',
        npi: '',
        addressLine: '',
        city: '',
        state: '',
        postalCode: '',
      });
      
      notifications.show({
        title: 'Success',
        message: 'Provider created and invitation sent!',
        color: 'green',
      });
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create provider or send invite.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Add New Provider" size="lg" centered>
      <form onSubmit={handleSubmit}>
        <Stack>
          <Group grow>
            <TextInput
              label="First Name"
              placeholder="John"
              required
              value={formData.firstName}
              onChange={(event) => handleChange('firstName', event.currentTarget.value)}
            />
            <TextInput
              label="Last Name"
              placeholder="Doe"
              required
              value={formData.lastName}
              onChange={(event) => handleChange('lastName', event.currentTarget.value)}
            />
          </Group>

          <Select
            label="Gender"
            placeholder="Select gender"
            data={['male', 'female', 'other', 'unknown']}
            value={formData.gender}
            onChange={(value) => handleChange('gender', value)}
          />

          <Group grow>
            <TextInput
              label="Email"
              placeholder="john.doe@hospital.com"
              type="email"
              required
              value={formData.email}
              onChange={(event) => handleChange('email', event.currentTarget.value)}
            />
            <TextInput
              label="Phone"
              placeholder="555-123-4567"
              type="tel"
              value={formData.phone}
              onChange={(event) => handleChange('phone', event.currentTarget.value)}
            />
          </Group>

          <Group grow>
            <TextInput
              label="NPI Number"
              placeholder="1234567890"
              value={formData.npi}
              onChange={(event) => handleChange('npi', event.currentTarget.value)}
            />
            <TextInput
              label="Specialty"
              placeholder="e.g., Cardiology, Family Medicine"
              value={formData.specialty}
              onChange={(event) => handleChange('specialty', event.currentTarget.value)}
            />
          </Group>

          <Textarea
            label="Qualification"
            placeholder="MD, DO, NP, PA, etc."
            value={formData.qualification}
            onChange={(event) => handleChange('qualification', event.currentTarget.value)}
            rows={2}
          />

          <TextInput
            label="Address Line 1"
            placeholder="123 Medical Center Drive"
            value={formData.addressLine}
            onChange={(event) => handleChange('addressLine', event.currentTarget.value)}
          />

          <Group grow>
            <TextInput
              label="City"
              placeholder="Anytown"
              value={formData.city}
              onChange={(event) => handleChange('city', event.currentTarget.value)}
            />
            <TextInput
              label="State"
              placeholder="CA"
              value={formData.state}
              onChange={(event) => handleChange('state', event.currentTarget.value)}
            />
            <TextInput
              label="Postal Code"
              placeholder="12345"
              value={formData.postalCode}
              onChange={(event) => handleChange('postalCode', event.currentTarget.value)}
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} leftSection={<IconUserPlus size={16} />}>
              Create Provider
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

