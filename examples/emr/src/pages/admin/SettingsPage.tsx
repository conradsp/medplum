import { Paper, Title, Text, Stack, TextInput, Button, Group, FileInput, Image } from '@mantine/core';
import { Document, useMedplum } from '@medplum/react';
import { IconSettings, IconUpload, IconCheck } from '@tabler/icons-react';
import { JSX, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { handleError, showSuccess } from '../../utils/errorHandling';
import { getEMRSettings, saveEMRSettings } from '../../utils/settings';
import styles from './SettingsPage.module.css';

export function SettingsPage(): JSX.Element {
  const { t } = useTranslation();
  const medplum = useMedplum();
  const [loading, setLoading] = useState(false);
  const [emrName, setEmrName] = useState('Medplum EMR');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getEMRSettings(medplum);
      if (settings) {
        setEmrName(settings.name);
        setCurrentLogo(settings.logo);
      }
    };
    loadSettings();
  }, [medplum]);

  // Handle logo file selection
  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logoDataUrl = currentLogo;

      // If a new logo was uploaded, convert to data URL
      if (logoFile) {
        logoDataUrl = logoPreview;
      }

      await saveEMRSettings(medplum, {
        name: emrName,
        logo: logoDataUrl,
      });

      showSuccess(t('admin.settings.saveSuccess'));
      
      // Notify app that settings have changed
      // The Header component will pick this up and reload settings
      window.dispatchEvent(new Event('emr-settings-changed'));
    } catch (error) {
      handleError(error, t('admin.settings.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setCurrentLogo(null);
  };

  return (
    <Document>
      <Paper shadow="sm" p="lg" withBorder className={styles.paperCentered}>
        <Group mb="lg">
          <IconSettings size={24} className={styles.icon} />
          <div>
            <Title order={2}>{t('admin.settings.title')}</Title>
            <Text size="sm" c="dimmed">
              {t('admin.settings.subtitle')}
            </Text>
          </div>
        </Group>

        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            {/* EMR Name */}
            <TextInput
              label={t('admin.settings.emrName')}
              description={t('admin.settings.emrNameDescription')}
              placeholder={t('admin.settings.emrNamePlaceholder')}
              required
              value={emrName}
              onChange={(event) => setEmrName(event.currentTarget.value)}
              size="md"
            />

            {/* Logo Upload */}
            <div>
              <Text size="sm" fw={500} mb="xs">
                {t('admin.settings.emrLogo')}
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                {t('admin.settings.emrLogoDescription')}
              </Text>

              {/* Current/Preview Logo */}
              {((currentLogo && currentLogo.length > 0) || (logoPreview && logoPreview.length > 0)) && (
                <Paper p="md" mb="md" withBorder bg="gray.0">
                  <Group justify="space-between">
                    <div>
                      <Text size="sm" fw={500} mb="xs">
                        {logoPreview ? t('admin.settings.logoPreview') : t('admin.settings.currentLogo')}
                      </Text>
                      <Image
                        src={logoPreview || currentLogo || ''}
                        alt="Logo"
                        h={40}
                        w="auto"
                        fit="contain"
                      />
                    </div>
                    <Button
                      variant="light"
                      color="red"
                      size="sm"
                      onClick={handleRemoveLogo}
                    >
                      {t('admin.settings.removeLogo')}
                    </Button>
                  </Group>
                </Paper>
              )}

              <FileInput
                leftSection={<IconUpload size={16} />}
                placeholder={t('admin.settings.chooseLogoFile')}
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                value={logoFile}
                onChange={handleLogoChange}
              />
            </div>

            {/* Save Button */}
            <Group justify="flex-end" mt="md">
              <Button
                type="submit"
                loading={loading}
                leftSection={<IconCheck size={16} />}
                size="md"
              >
                {t('admin.settings.saveSettings')}
              </Button>
            </Group>
          </Stack>
        </form>

        {/* Info Box */}
        <Paper p="md" mt="xl" bg="blue.0" radius="md">
          <Text size="sm" fw={500} mb="xs">
            {t('admin.settings.note')}
          </Text>
          <Text size="sm">
            {t('admin.settings.noteDescription')}
          </Text>
        </Paper>
      </Paper>
    </Document>
  );
}

