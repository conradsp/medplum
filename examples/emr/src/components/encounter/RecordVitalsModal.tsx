import { Modal, Button, NumberInput, Stack, Group, Text, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMedplum } from '@medplum/react';
import { Observation, Encounter, Patient, Reference } from '@medplum/fhirtypes';
import { JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RecordVitalsModalProps {
  opened: boolean;
  onClose: () => void;
  encounter: Encounter;
  patient: Patient;
  onSuccess?: () => void;
}

interface VitalsData {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
}

export function RecordVitalsModal({ opened, onClose, encounter, patient, onSuccess }: RecordVitalsModalProps): JSX.Element {
  const medplum = useMedplum();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [vitals, setVitals] = useState<VitalsData>({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    respiratoryRate: '',
    temperature: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      const patientRef = {
        reference: `Patient/${patient.id}`,
        display: patient.name?.[0]?.text || [patient.name?.[0]?.given?.[0], patient.name?.[0]?.family].filter(Boolean).join(' '),
      } as Reference<Patient>;
      const encounterRef = {
        reference: `Encounter/${encounter.id}`,
      } as Reference<Encounter>;

      const effectiveDateTime = new Date().toISOString();
      const observations: Observation[] = [];

      // Blood Pressure (multi-component observation)
      if (vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic) {
        observations.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: t('recordVitals.vitals'),
            }],
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '85354-9',
              display: t('recordVitals.bloodPressure'),
            }],
            text: t('recordVitals.bloodPressure'),
          },
          subject: patientRef,
          encounter: encounterRef,
          effectiveDateTime,
          component: [
            {
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '8480-6',
                  display: t('recordVitals.systolic'),
                }],
              },
              valueQuantity: {
                value: parseFloat(vitals.bloodPressureSystolic),
                unit: 'mmHg',
                system: 'http://unitsofmeasure.org',
                code: 'mm[Hg]',
              },
            },
            {
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '8462-4',
                  display: t('recordVitals.diastolic'),
                }],
              },
              valueQuantity: {
                value: parseFloat(vitals.bloodPressureDiastolic),
                unit: 'mmHg',
                system: 'http://unitsofmeasure.org',
                code: 'mm[Hg]',
              },
            },
          ],
        });
      }

      // Heart Rate
      if (vitals.heartRate) {
        observations.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            }],
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8867-4',
              display: 'Heart rate',
            }],
            text: 'Heart Rate',
          },
          subject: patientRef,
          encounter: encounterRef,
          effectiveDateTime,
          valueQuantity: {
            value: parseFloat(vitals.heartRate),
            unit: 'beats/min',
            system: 'http://unitsofmeasure.org',
            code: '/min',
          },
        });
      }

      // Respiratory Rate
      if (vitals.respiratoryRate) {
        observations.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            }],
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '9279-1',
              display: 'Respiratory rate',
            }],
            text: 'Respiratory Rate',
          },
          subject: patientRef,
          encounter: encounterRef,
          effectiveDateTime,
          valueQuantity: {
            value: parseFloat(vitals.respiratoryRate),
            unit: 'breaths/min',
            system: 'http://unitsofmeasure.org',
            code: '/min',
          },
        });
      }

      // Body Temperature
      if (vitals.temperature) {
        observations.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            }],
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8310-5',
              display: 'Body temperature',
            }],
            text: 'Temperature',
          },
          subject: patientRef,
          encounter: encounterRef,
          effectiveDateTime,
          valueQuantity: {
            value: parseFloat(vitals.temperature),
            unit: '°F',
            system: 'http://unitsofmeasure.org',
            code: '[degF]',
          },
        });
      }

      // Oxygen Saturation
      if (vitals.oxygenSaturation) {
        observations.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            }],
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '2708-6',
              display: 'Oxygen saturation in Arterial blood',
            }],
            text: 'Oxygen Saturation',
          },
          subject: patientRef,
          encounter: encounterRef,
          effectiveDateTime,
          valueQuantity: {
            value: parseFloat(vitals.oxygenSaturation),
            unit: '%',
            system: 'http://unitsofmeasure.org',
            code: '%',
          },
        });
      }

      // Body Weight
      if (vitals.weight) {
        observations.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            }],
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '29463-7',
              display: 'Body weight',
            }],
            text: 'Weight',
          },
          subject: patientRef,
          encounter: encounterRef,
          effectiveDateTime,
          valueQuantity: {
            value: parseFloat(vitals.weight),
            unit: 'lbs',
            system: 'http://unitsofmeasure.org',
            code: '[lb_av]',
          },
        });
      }

      // Body Height
      if (vitals.height) {
        observations.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            }],
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8302-2',
              display: 'Body height',
            }],
            text: 'Height',
          },
          subject: patientRef,
          encounter: encounterRef,
          effectiveDateTime,
          valueQuantity: {
            value: parseFloat(vitals.height),
            unit: 'in',
            system: 'http://unitsofmeasure.org',
            code: '[in_i]',
          },
        });
      }

      // Create all observations
      await Promise.all(observations.map(obs => medplum.createResource(obs)));
      
      // Reset form
      setVitals({
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        respiratoryRate: '',
        temperature: '',
        oxygenSaturation: '',
        weight: '',
        height: '',
      });
      
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      notifications.show({
        title: t('recordVitals.errorTitle'),
        message: t('recordVitals.errorMessage'),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('recordVitals.title')} size="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {t('recordVitals.instructions', { patient: patient.name?.[0]?.text || t('patientOverview.noneReported') })}
          </Text>

          <Divider label={t('recordVitals.bloodPressure')} />
          <Group grow>
            <NumberInput
              label={t('recordVitals.systolic')}
              placeholder={t('recordVitals.placeholder.systolic')}
              min={0}
              max={300}
              value={vitals.bloodPressureSystolic}
              onChange={(value) => setVitals({ ...vitals, bloodPressureSystolic: value?.toString() || '' })}
            />
            <NumberInput
              label={t('recordVitals.diastolic')}
              placeholder={t('recordVitals.placeholder.diastolic')}
              min={0}
              max={200}
              value={vitals.bloodPressureDiastolic}
              onChange={(value) => setVitals({ ...vitals, bloodPressureDiastolic: value?.toString() || '' })}
            />
          </Group>

          <Divider label={t('recordVitals.vitals')} />
          <Group grow>
            <NumberInput
              label={t('recordVitals.heartRate')}
              placeholder={t('recordVitals.placeholder.heartRate')}
              min={0}
              max={300}
              value={vitals.heartRate}
              onChange={(value) => setVitals({ ...vitals, heartRate: value?.toString() || '' })}
            />
            <NumberInput
              label={t('recordVitals.respiratoryRate')}
              placeholder={t('recordVitals.placeholder.respiratoryRate')}
              min={0}
              max={100}
              value={vitals.respiratoryRate}
              onChange={(value) => setVitals({ ...vitals, respiratoryRate: value?.toString() || '' })}
            />
          </Group>

          <Group grow>
            <NumberInput
              label={t('recordVitals.temperature')}
              placeholder={t('recordVitals.placeholder.temperature')}
              min={90}
              max={110}
              decimalScale={1}
              value={vitals.temperature}
              onChange={(value) => setVitals({ ...vitals, temperature: value?.toString() || '' })}
            />
            <NumberInput
              label={t('recordVitals.oxygenSaturation')}
              placeholder={t('recordVitals.placeholder.oxygenSaturation')}
              min={0}
              max={100}
              value={vitals.oxygenSaturation}
              onChange={(value) => setVitals({ ...vitals, oxygenSaturation: value?.toString() || '' })}
            />
          </Group>

          <Divider label={t('recordVitals.measurements')} />
          <Group grow>
            <NumberInput
              label={t('recordVitals.weight')}
              placeholder={t('recordVitals.placeholder.weight')}
              min={0}
              max={1000}
              decimalScale={1}
              value={vitals.weight}
              onChange={(value) => setVitals({ ...vitals, weight: value?.toString() || '' })}
            />
            <NumberInput
              label={t('recordVitals.height')}
              placeholder={t('recordVitals.placeholder.height')}
              min={0}
              max={100}
              decimalScale={1}
              value={vitals.height}
              onChange={(value) => setVitals({ ...vitals, height: value?.toString() || '' })}
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={loading}>
              {t('recordVitals.cancel')}
            </Button>
            <Button type="submit" loading={loading}>
              {t('recordVitals.submit')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

