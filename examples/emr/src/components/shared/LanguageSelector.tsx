import { Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export function LanguageSelector(): JSX.Element {
  const { i18n } = useTranslation();
  return (
    <Select
      data={[
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Español' },
      ]}
      value={i18n.language}
      onChange={(lang) => lang && i18n.changeLanguage(lang)}
      size="xs"
      style={{ minWidth: 100 }}
    />
  );
}
