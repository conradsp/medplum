import { MedplumClient } from '@medplum/core';
import { Organization } from '@medplum/fhirtypes';
import { logger } from './logger';

export interface EMRSettings {
  name: string;
  logo: string | null;
}

const SETTINGS_ORG_IDENTIFIER = 'emr-settings';

/**
 * Get EMR settings from the Organization resource
 */
export async function getEMRSettings(medplum: MedplumClient): Promise<EMRSettings | null> {
  try {
    // Search for the settings organization
    const result = await medplum.search('Organization', {
      identifier: SETTINGS_ORG_IDENTIFIER,
      _count: '1',
    });

    if (result.entry && result.entry.length > 0) {
      const org = result.entry[0].resource as Organization;
      return {
        name: org.name || 'Medplum EMR',
        logo: org.extension?.find(ext => ext.url === 'logo')?.valueString || null,
      };
    }

    return null;
  } catch (error) {
    logger.error('Failed to load EMR settings', error);
    return null;
  }
}

/**
 * Save EMR settings to the Organization resource
 */
export async function saveEMRSettings(medplum: MedplumClient, settings: EMRSettings): Promise<void> {
  try {
    // Search for existing settings organization
    const result = await medplum.search('Organization', {
      identifier: SETTINGS_ORG_IDENTIFIER,
      _count: '1',
    });

    const extension = settings.logo ? [
      {
        url: 'logo',
        valueString: settings.logo,
      },
    ] : undefined;

    if (result.entry && result.entry.length > 0) {
      // Update existing
      const org = result.entry[0].resource as Organization;
      await medplum.updateResource({
        ...org,
        name: settings.name,
        extension,
      });
    } else {
      // Create new
      await medplum.createResource({
        resourceType: 'Organization',
        identifier: [
          {
            system: 'http://medplum.com/emr',
            value: SETTINGS_ORG_IDENTIFIER,
          },
        ],
        name: settings.name,
        extension,
        active: true,
      });
    }
  } catch (error) {
    logger.error('Failed to save EMR settings', error);
    throw error;
  }
}

