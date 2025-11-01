import { Paper, Title, Container } from '@mantine/core';
import { Logo, RegisterForm } from '@medplum/react';
import { JSX } from 'react';
import { useNavigate } from 'react-router';

export function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  
  return (
    <Container size="xs" style={{ marginTop: '100px' }}>
      <Paper shadow="xl" p="xl" radius="md" withBorder>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Logo size={32} />
          <Title order={2} mt="md">Register for EMR</Title>
        </div>
        <RegisterForm
          type="project"
          onSuccess={() => {
            navigate('/');
          }}
        >
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>Create an account to get started</p>
          </div>
        </RegisterForm>
      </Paper>
    </Container>
  );
}

