import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { MedplumClient } from '@medplum/core';
import { MedplumProvider } from '@medplum/react';
import '@medplum/react/styles.css';
import './App.css';
import './styles/global.css';
import './styles/variables.css';
import './styles/utilities.css';
import './styles/common.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { EMRApp } from './EMRApp';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { getEnvConfig } from './utils/envValidation';
import { logger } from './utils/logger';

// Validate environment variables before starting the app
let envConfig;
try {
  envConfig = getEnvConfig();
  logger.info('Environment configuration validated', {
    baseUrl: envConfig.VITE_MEDPLUM_BASE_URL,
    hasClientId: !!envConfig.VITE_MEDPLUM_CLIENT_ID,
    hasGoogleClientId: !!envConfig.VITE_GOOGLE_CLIENT_ID,
  });
} catch (error) {
  // Show error in console for developer
  console.error(error instanceof Error ? error.message : error);
  
  // Create error message element
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="font-family: monospace; padding: 40px; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #c92a2a; margin-bottom: 20px;">⚠️ Configuration Error</h1>
        <div style="background: #fff3f3; border: 2px solid #ffa8a8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <pre style="white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${error instanceof Error ? error.message : 'Unknown configuration error'}</pre>
        </div>
        <p style="color: #666;">The application cannot start without proper configuration. Please check your .env file.</p>
      </div>
    `;
  }
  throw error;
}

const medplum = new MedplumClient({
  baseUrl: envConfig.VITE_MEDPLUM_BASE_URL,
  clientId: envConfig.VITE_MEDPLUM_CLIENT_ID,
  onUnauthenticated: () => {
    if (window.location.pathname !== '/signin' && window.location.pathname !== '/register') {
      logger.info('User unauthenticated, redirecting to sign in');
      window.location.href = '/signin';
    }
  },
});

const theme = createTheme({
  headings: {
    sizes: {
      h1: {
        fontSize: '1.125rem',
        fontWeight: '500',
        lineHeight: '2.0',
      },
    },
  },
  fontSizes: {
    xs: '0.6875rem',
    sm: '0.875rem',
    md: '0.875rem',
    lg: '1.0rem',
    xl: '1.125rem',
  },
});

const container = document.getElementById('root') as HTMLDivElement;
const root = createRoot(container);
root.render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <MedplumProvider medplum={medplum}>
          <MantineProvider theme={theme}>
            <Notifications />
            <EMRApp />
          </MantineProvider>
        </MedplumProvider>
      </BrowserRouter>
    </I18nextProvider>
  </StrictMode>
);

