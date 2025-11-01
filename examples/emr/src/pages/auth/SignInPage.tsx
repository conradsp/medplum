import { Paper, Title, Container, Image } from '@mantine/core';
import { Logo, SignInForm, useMedplumContext } from '@medplum/react';
import { JSX, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

export function SignInPage(): JSX.Element {
  const navigate = useNavigate();
  const { medplum } = useMedplumContext();
  const [clinicName, setClinicName] = useState<string>('EMR');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Try to load branding settings (without authentication)
    const loadSettings = async () => {
      try {
        // Try to search for the settings organization
        // Note: This will only work if the Organization is publicly readable
        // Otherwise, we'll use defaults until the user logs in
        const result = await medplum.search('Organization', {
          identifier: 'emr-settings',
          _count: '1',
        });

        if (result.entry && result.entry.length > 0) {
          const org = result.entry[0].resource as any;
          if (org.name) {
            setClinicName(org.name);
          }
          // Logo is stored in extension
          const logoExt = org.extension?.find((ext: any) => ext.url === 'logo');
          if (logoExt?.valueString) {
            setLogoUrl(logoExt.valueString);
          }
        }
      } catch (error) {
        // If loading fails (unauthenticated or not found), just use defaults
        // Using default branding
      }
    };
    
    loadSettings();
  }, [medplum]);
  
  return (
    <Container size="xs" style={{ marginTop: '100px' }}>
      <Paper shadow="xl" p="xl" radius="md" withBorder>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${clinicName} Logo`}
              h={32}
              w="auto"
              fit="contain"
              style={{ margin: '0 auto' }}
            />
          ) : (
            <Logo size={32} />
          )}
          <Title order={2} mt="md">Sign in to {clinicName}</Title>
        </div>
        <SignInForm
          onSuccess={() => {
            navigate('/');
          }}
          onForgotPassword={() => {/* Forgot password */}}
          onRegister={() => navigate('/register')}
        />
      </Paper>
    </Container>
  );
}

