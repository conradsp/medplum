import { JSX, useState, useEffect } from 'react';
import { Modal, TextInput, Textarea, Button, Group, Stack, Select, NumberInput } from '@mantine/core';
import { useMedplum } from '@medplum/react';
import { ActivityDefinition } from '@medplum/fhirtypes';
import { notifications } from '@mantine/notifications';
import { saveLabTest, LabTestDefinition, LabTestResultField } from '../../utils/labTests';
import { getPriceFromResource } from '../../utils/billing';

interface EditLabTestModalProps {
  opened: boolean;
  onClose: (saved: boolean) => void;
  test: ActivityDefinition | null;
}

const CATEGORIES = [
  'Chemistry',
  'Hematology',
  'Microbiology',
  'Immunology',
  'Coagulation',
  'Toxicology',
  'Other',
];

const SPECIMEN_TYPES = [
  'Whole Blood',
  'Serum',
  'Plasma',
  'Urine',
  'Throat Swab',
  'Nasopharyngeal Swab',
  'Sputum',
  'Stool',
  'Other',
];

export function EditLabTestModal({ opened, onClose, test }: EditLabTestModalProps): JSX.Element {
  const medplum = useMedplum();
  const [loading, setLoading] = useState(false);
  
  const [code, setCode] = useState('');
  const [display, setDisplay] = useState('');
  const [loincCode, setLoincCode] = useState('');
  const [category, setCategory] = useState<string | null>('Chemistry');
  const [specimenType, setSpecimenType] = useState<string | null>('Serum');
  const [description, setDescription] = useState('');
  const [resultFields, setResultFields] = useState<LabTestResultField[]>([]);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (test) {
      // Load existing test data
      setCode(test.identifier?.[0]?.value || '');
      setDisplay(test.title || '');
      setLoincCode(test.code?.coding?.[0]?.code || '');
      setCategory(test.extension?.find(e => e.url === 'category')?.valueString || 'Chemistry');
      setSpecimenType(test.extension?.find(e => e.url === 'specimenType')?.valueString || 'Serum');
      setDescription(test.description || '');
      setPrice(getPriceFromResource(test) || 0);
      
      // Load result fields from extension (if present)
      const resultFieldsExt = test.extension?.find(e => e.url === 'resultFields');
      if (resultFieldsExt?.valueString) {
        try {
          setResultFields(JSON.parse(resultFieldsExt.valueString));
        } catch {
          setResultFields([]);
        }
      } else {
        setResultFields([]);
      }
    } else {
      // Reset for new test
      setCode('');
      setDisplay('');
      setLoincCode('');
      setCategory('Chemistry');
      setSpecimenType('Serum');
      setDescription('');
      setResultFields([]);
      setPrice(0);
    }
  }, [test, opened]);

  // Handlers for result fields
  const handleFieldChange = (idx: number, field: Partial<LabTestResultField>) => {
    setResultFields(fields => fields.map((f, i) => i === idx ? { ...f, ...field } : f));
  };
  const handleAddField = () => {
    setResultFields(fields => [...fields, { name: '', label: '', type: 'string' }]);
  };
  const handleRemoveField = (idx: number) => {
    setResultFields(fields => fields.filter((_, i) => i !== idx));
  };

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
      const testDef: LabTestDefinition = {
        code: code.trim(),
        display: display.trim(),
        loincCode: loincCode.trim() || undefined,
        category: category || 'Chemistry',
        specimenType: specimenType || undefined,
        description: description.trim() || undefined,
        resultFields: resultFields.length > 0 ? resultFields : undefined,
        price,
      };

      await saveLabTest(medplum, testDef);
      
      notifications.show({
        title: 'Success',
        message: test ? 'Lab test updated successfully' : 'Lab test created successfully',
        color: 'green',
      });
      onClose(true);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save lab test',
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
      title={test ? 'Edit Lab Test' : 'Add Lab Test'}
      size="lg"
    >
      <Stack gap="md">
        <TextInput
          label="Test Code"
          placeholder="e.g., cmp, hba1c"
          value={code}
          onChange={(e) => setCode(e.currentTarget.value)}
          required
          disabled={!!test}
          description={test ? 'Cannot change code of existing test' : 'Unique identifier for this test'}
        />

        <TextInput
          label="Test Name"
          placeholder="e.g., Comprehensive Metabolic Panel"
          value={display}
          onChange={(e) => setDisplay(e.currentTarget.value)}
          required
        />

        <TextInput
          label="LOINC Code"
          placeholder="e.g., 24323-8"
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
          label="Specimen Type"
          placeholder="Select specimen type"
          data={SPECIMEN_TYPES}
          value={specimenType}
          onChange={setSpecimenType}
        />

        <Textarea
          label="Description"
          placeholder="Brief description of the test"
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

        {/* Result Fields Section */}
        <Stack gap="xs">
          <Group justify="space-between">
            <div style={{ fontWeight: 500 }}>Result Fields</div>
            <Button size="xs" variant="light" onClick={handleAddField}>Add Field</Button>
          </Group>
          {resultFields.length === 0 && (
            <div style={{ color: '#888', fontSize: '0.9em' }}>No result fields defined</div>
          )}
          {resultFields.map((field, idx) => (
            <Group key={idx} gap="xs" align="flex-end">
              <TextInput
                label="Name"
                value={field.name}
                onChange={e => handleFieldChange(idx, { name: e.currentTarget.value })}
                placeholder="e.g. glucose"
                required
                style={{ width: 120 }}
              />
              <TextInput
                label="Label"
                value={field.label}
                onChange={e => handleFieldChange(idx, { label: e.currentTarget.value })}
                placeholder="e.g. Glucose"
                required
                style={{ width: 140 }}
              />
              <Select
                label="Type"
                data={[{ value: 'string', label: 'String' }, { value: 'number', label: 'Number' }, { value: 'boolean', label: 'Boolean' }, { value: 'select', label: 'Select' }]}
                value={field.type}
                onChange={val => handleFieldChange(idx, { type: val as LabTestResultField['type'] })}
                style={{ width: 100 }}
              />
              <TextInput
                label="Unit"
                value={field.unit || ''}
                onChange={e => handleFieldChange(idx, { unit: e.currentTarget.value })}
                placeholder="e.g. mg/dL"
                style={{ width: 100 }}
              />
              {field.type === 'select' && (
                <TextInput
                  label="Options (comma separated)"
                  value={field.options?.join(',') || ''}
                  onChange={e => handleFieldChange(idx, { options: e.currentTarget.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="e.g. Positive,Negative"
                  style={{ width: 160 }}
                />
              )}
              <Button size="xs" color="red" variant="subtle" onClick={() => handleRemoveField(idx)}>
                Remove
              </Button>
            </Group>
          ))}
        </Stack>

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

