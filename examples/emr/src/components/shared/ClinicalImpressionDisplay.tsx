import { Blockquote, Stack, Paper, Title } from '@mantine/core';
import { getReferenceString } from '@medplum/core';
import { Patient } from '@medplum/fhirtypes';
import { Loading, NoteDisplay, useSearchResources } from '@medplum/react';
import { IconFileText } from '@tabler/icons-react';
import { JSX } from 'react';
import { useTranslation } from 'react-i18next';

interface ClinicalImpressionDisplayProps {
  readonly patient: Patient;
}

export function ClinicalImpressionDisplay({ patient }: ClinicalImpressionDisplayProps): JSX.Element {
  const { t } = useTranslation();
  const [impressions] = useSearchResources('ClinicalImpression', { patient: getReferenceString(patient) });

  if (!impressions) {
    return <Loading />;
  }

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Title order={4} mb="md">
        <IconFileText size={20} style={{ display: 'inline', marginRight: '8px' }} />
        {t('clinicalNotes.title', 'Clinical Notes')}
      </Title>
      {impressions.length === 0 ? (
        <Blockquote color="dark">{t('clinicalNotes.none', 'No Notes')}</Blockquote>
      ) : (
        <Stack>
          {impressions.map((impression, idx) => (
            <NoteDisplay key={idx} value={impression.note} />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

