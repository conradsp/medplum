import { JSX, useState, useEffect } from 'react';
import { Modal, Button, Group, Stack, Select, Textarea, Radio } from '@mantine/core';
import { useMedplum } from '@medplum/react';
import { Patient, Encounter, Condition } from '@medplum/fhirtypes';
import { notifications } from '@mantine/notifications';
import { getAllDiagnosisCodes } from '../../utils/diagnosisCodes';
import { useTranslation } from 'react-i18next';

interface AddDiagnosisModalProps {
  opened: boolean;
  onClose: (saved: boolean) => void;
  patient: Patient;
  encounter?: Encounter;
}

export function AddDiagnosisModal({ opened, onClose, patient, encounter }: AddDiagnosisModalProps): JSX.Element {
  const { t } = useTranslation();
  const medplum = useMedplum();
  const [loading, setLoading] = useState(false);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [diagnosisCodes, setDiagnosisCodes] = useState<Array<{ value: string; label: string; system: string }>>([]);
  
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [clinicalStatus, setClinicalStatus] = useState('active');
  const [verificationStatus, setVerificationStatus] = useState('confirmed');
  const [severity, setSeverity] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (opened) {
      setSelectedCode(null);
      setClinicalStatus('active');
      setVerificationStatus('confirmed');
      setSeverity(null);
      setNotes('');
      loadDiagnosisCodes();
    }
  }, [opened]);

  const loadDiagnosisCodes = async () => {
    setLoadingCodes(true);
    try {
      const codes = await getAllDiagnosisCodes(medplum);
      const options = codes.map(c => ({
        value: `${c.system}|${c.code}`,
        label: `${c.code} - ${c.display}`,
        system: c.system || '',
      }));
      setDiagnosisCodes(options);
    } catch (error) {
      notifications.show({
        title: t('error'),
        message: t('diagnosis.loadError'),
        color: 'red',
      });
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCode) {
      notifications.show({
        title: t('validationError'),
        message: t('diagnosis.selectDiagnosis'),
        color: 'yellow',
      });
      return;
    }

    setLoading(true);
    try {
      const [system, code] = selectedCode.split('|');
      const selectedDiagnosis = diagnosisCodes.find(d => d.value === selectedCode);
      const display = selectedDiagnosis?.label.split(' - ')[1] || '';

      const condition: Condition = {
        resourceType: 'Condition',
        clinicalStatus: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
              code: clinicalStatus,
              display: clinicalStatus.charAt(0).toUpperCase() + clinicalStatus.slice(1),
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
              code: verificationStatus,
              display: verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1),
            },
          ],
        },
        code: {
          coding: [
            {
              system,
              code,
              display,
            },
          ],
          text: display,
        },
        subject: {
          reference: `Patient/${patient.id}`,
          display: patient.name?.[0]?.text,
        },
        encounter: encounter ? {
          reference: `Encounter/${encounter.id}`,
        } : undefined,
        onsetDateTime: new Date().toISOString(),
        recordedDate: new Date().toISOString(),
        recorder: {
          reference: `Practitioner/${medplum.getProfile()?.id}`,
          display: medplum.getProfile()?.name?.[0]?.text,
        },
        severity: severity ? {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: severity === 'mild' ? '255604002' : severity === 'moderate' ? '6736007' : '24484000',
              display: severity.charAt(0).toUpperCase() + severity.slice(1),
            },
          ],
        } : undefined,
        note: notes ? [{ text: notes }] : undefined,
      };

      await medplum.createResource(condition);

      notifications.show({
        title: t('success'),
        message: t('diagnosis.addSuccess'),
        color: 'green',
      });
      onClose(true);
    } catch (error) {
      logger.error('Failed to add diagnosis', error);
      notifications.show({
        title: t('error'),
        message: t('diagnosis.addError'),
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
      title={t('diagnosis.addDiagnosis')}
      size="lg"
    >
      <Stack gap="md">
        <Select
          label={t('diagnosis.code')}
          placeholder={t('diagnosis.searchCode')}
          data={diagnosisCodes}
          value={selectedCode}
          onChange={setSelectedCode}
          searchable
          required
          disabled={loadingCodes}
        />

        <Radio.Group
          label={t('diagnosis.clinicalStatus')}
          value={clinicalStatus}
          onChange={setClinicalStatus}
        >
          <Stack gap="xs" mt="xs">
            <Radio value="active" label={t('diagnosis.status.active')} />
            <Radio value="recurrence" label={t('diagnosis.status.recurrence')} />
            <Radio value="relapse" label={t('diagnosis.status.relapse')} />
            <Radio value="inactive" label={t('diagnosis.status.inactive')} />
            <Radio value="remission" label={t('diagnosis.status.remission')} />
            <Radio value="resolved" label={t('diagnosis.status.resolved')} />
          </Stack>
        </Radio.Group>

        <Radio.Group
          label={t('diagnosis.verificationStatus')}
          value={verificationStatus}
          onChange={setVerificationStatus}
        >
          <Stack gap="xs" mt="xs">
            <Radio value="confirmed" label={t('diagnosis.verification.confirmed')} />
            <Radio value="provisional" label={t('diagnosis.verification.provisional')} />
            <Radio value="differential" label={t('diagnosis.verification.differential')} />
            <Radio value="unconfirmed" label={t('diagnosis.verification.unconfirmed')} />
            <Radio value="refuted" label={t('diagnosis.verification.refuted')} />
          </Stack>
        </Radio.Group>

        <Select
          label={t('diagnosis.severity')}
          placeholder={t('diagnosis.selectSeverity')}
          data={[
            { value: 'mild', label: t('diagnosis.severityLevels.mild') },
            { value: 'moderate', label: t('diagnosis.severityLevels.moderate') },
            { value: 'severe', label: t('diagnosis.severityLevels.severe') },
          ]}
          value={severity}
          onChange={setSeverity}
          clearable
        />

        <Textarea
          label={t('diagnosis.notes')}
          placeholder={t('diagnosis.additionalNotes')}
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          rows={3}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={() => onClose(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {t('diagnosis.addDiagnosis')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

