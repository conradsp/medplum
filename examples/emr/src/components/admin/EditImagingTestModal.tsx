import { JSX, useState, useEffect } from 'react';
import { Modal, TextInput, Textarea, Button, Group, Stack, Select, NumberInput } from '@mantine/core';
import { useMedplum } from '@medplum/react';
import { ActivityDefinition } from '@medplum/fhirtypes';
import { notifications } from '@mantine/notifications';
import { saveImagingTest, ImagingTestDefinition } from '../../utils/imagingTests';
import { getPriceFromResource } from '../../utils/billing';

interface EditImagingTestModalProps {
  opened: boolean;
  onClose: (saved: boolean) => void;
  test: ActivityDefinition | null;
}

const CATEGORIES = [
  'X-Ray',
  'CT',
  'MRI',
  'Ultrasound',
  'Nuclear Medicine',
  'Mammography',
  'Fluoroscopy',
  'Other',
];

const MODALITIES = [
  { value: 'DX', label: 'Digital Radiography' },
  { value: 'CT', label: 'Computed Tomography' },
  { value: 'MR', label: 'Magnetic Resonance' },
  { value: 'US', label: 'Ultrasound' },
  { value: 'NM', label: 'Nuclear Medicine' },
  { value: 'MG', label: 'Mammography' },
  { value: 'DXA', label: 'Dual X-Ray Absorptiometry' },
  { value: 'PT', label: 'PET' },
  { value: 'RF', label: 'Fluoroscopy' },
];

const BODY_PARTS = [
  'Head',
  'Brain',
  'Chest',
  'Abdomen',
  'Pelvis',
  'Spine',
  'Cervical Spine',
  'Thoracic Spine',
  'Lumbar Spine',
  'Shoulder',
  'Elbow',
  'Wrist',
  'Hand',
  'Hip',
  'Knee',
  'Ankle',
  'Foot',
  'Breast',
  'Heart',
  'Other',
];

export function EditImagingTestModal({ opened, onClose, test }: EditImagingTestModalProps): JSX.Element {
  const medplum = useMedplum();
  const [loading, setLoading] = useState(false);
  
  const [code, setCode] = useState('');
  const [display, setDisplay] = useState('');
  const [loincCode, setLoincCode] = useState('');
  const [category, setCategory] = useState<string | null>('X-Ray');
  const [bodyPart, setBodyPart] = useState<string | null>('Chest');
  const [modality, setModality] = useState<string | null>('DX');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (test) {
      // Load existing test data
      setCode(test.identifier?.[0]?.value || '');
      setDisplay(test.title || '');
      setLoincCode(test.code?.coding?.[0]?.code || '');
      setCategory(test.extension?.find(e => e.url === 'category')?.valueString || 'X-Ray');
      setBodyPart(test.extension?.find(e => e.url === 'bodyPart')?.valueString || 'Chest');
      setModality(test.extension?.find(e => e.url === 'modality')?.valueString || 'DX');
      setDescription(test.description || '');
      setPrice(getPriceFromResource(test) || 0);
    } else {
      // Reset for new test
      setCode('');
      setDisplay('');
      setLoincCode('');
      setCategory('X-Ray');
      setBodyPart('Chest');
      setModality('DX');
      setDescription('');
      setPrice(0);
    }
  }, [test, opened]);

  const handleSave = async () => {
    if (!display.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Test name is required',
        color: 'red',
      });
      return;
    }

    if (!code.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Test code is required',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const testDef: ImagingTestDefinition = {
        code: code.trim(),
        display: display.trim(),
        loincCode: loincCode.trim() || undefined,
        category: category || 'X-Ray',
        bodyPart: bodyPart || undefined,
        modality: modality || undefined,
        description: description.trim() || undefined,
        price,
      };

      await saveImagingTest(medplum, testDef);
      
      notifications.show({
        title: 'Success',
        message: test ? 'Imaging test updated successfully' : 'Imaging test created successfully',
        color: 'green',
      });
      onClose(true);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save imaging test',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={() => onClose(false)}
      title={test ? 'Edit Imaging Test' : 'Add Imaging Test'}
      size="lg"
    >
      <Stack gap="md">
        <TextInput
          label="Test Code"
          placeholder="e.g., ct-head-wo, mri-brain-w"
          value={code}
          onChange={(e) => setCode(e.currentTarget.value)}
          required
          disabled={!!test}
          description={test ? 'Cannot change code of existing test' : 'Unique identifier for this test'}
        />

        <TextInput
          label="Test Name"
          placeholder="e.g., CT Head without Contrast"
          value={display}
          onChange={(e) => setDisplay(e.currentTarget.value)}
          required
        />

        <TextInput
          label="LOINC Code"
          placeholder="e.g., 82692-5"
          value={loincCode}
          onChange={(e) => setLoincCode(e.currentTarget.value)}
          description="Optional LOINC code for standard identification"
        />

        <Select
          label="Category"
          placeholder="Select category"
          data={CATEGORIES}
          value={category}
          onChange={setCategory}
          required
        />

        <Select
          label="Body Part"
          placeholder="Select body part"
          data={BODY_PARTS}
          value={bodyPart}
          onChange={setBodyPart}
        />

        <Select
          label="Modality"
          placeholder="Select modality"
          data={MODALITIES}
          value={modality}
          onChange={setModality}
        />

        <Textarea
          label="Description"
          placeholder="Brief description of the imaging study"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          rows={3}
        />

        <NumberInput
          label="Price ($)"
          value={price}
          onChange={(value) => setPrice(Number(value) || 0)}
          min={0}
          decimalScale={2}
          prefix="$"
          placeholder="0.00"
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={loading}>
            {test ? 'Update' : 'Create'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

