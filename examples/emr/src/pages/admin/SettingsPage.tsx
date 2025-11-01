import { Paper, Title, Text, Stack, TextInput, Button, Group, FileInput, Image } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Document, useMedplum } from '@medplum/react';
import { IconSettings, IconUpload, IconCheck } from '@tabler/icons-react';
import { JSX, useState, useEffect } from 'react';
import { getEMRSettings, saveEMRSettings } from '../../utils/settings';

export function SettingsPage(): JSX.Element {
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

      notifications.show({
        title: 'Success',
        message: 'Settings saved successfully!',
        color: 'green',
      });
      
      // Notify app that settings have changed
      // The Header component will pick this up and reload settings
      window.dispatchEvent(new Event('emr-settings-changed'));
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save settings. Please try again.',
        color: 'red',
      });
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
      <Paper shadow="sm" p="lg" withBorder style={{ marginTop: 0, maxWidth: 800, margin: '0 auto' }}>
        <Group mb="lg">
          <IconSettings size={24} style={{ color: '#228be6' }} />
          <div>
            <Title order={2}>EMR Settings</Title>
            <Text size="sm" c="dimmed">
              Customize your EMR name and logo
            </Text>
          </div>
        </Group>

        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            {/* EMR Name */}
            <TextInput
              label="EMR Name"
              description="This name will appear in the header"
              placeholder="My Hospital EMR"
              required
              value={emrName}
              onChange={(event) => setEmrName(event.currentTarget.value)}
              size="md"
            />

            {/* Logo Upload */}
            <div>
              <Text size="sm" fw={500} mb="xs">
                EMR Logo
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                Upload a logo to display in the header (recommended size: 40px height, PNG or JPG)
              </Text>

              {/* Current/Preview Logo */}
              {((currentLogo && currentLogo.length > 0) || (logoPreview && logoPreview.length > 0)) && (
                <Paper p="md" mb="md" withBorder bg="gray.0">
                  <Group justify="space-between">
                    <div>
                      <Text size="sm" fw={500} mb="xs">
                        {logoPreview ? 'Logo Preview' : 'Current Logo'}
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
                      Remove Logo
                    </Button>
                  </Group>
                </Paper>
              )}

              <FileInput
                leftSection={<IconUpload size={16} />}
                placeholder="Choose logo file"
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
                Save Settings
              </Button>
            </Group>
          </Stack>
        </form>

        {/* Info Box */}
        <Paper p="md" mt="xl" bg="blue.0" radius="md">
          <Text size="sm" fw={500} mb="xs">
            💡 Note
          </Text>
          <Text size="sm">
            After saving settings, the page will refresh automatically to display the new name and logo in the header.
          </Text>
        </Paper>
      </Paper>
    </Document>
  );
}

