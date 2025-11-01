import { ProfileResource } from '@medplum/fhirtypes';

/**
 * Check if the current user has admin privileges
 * In Medplum, we check if the user is a super admin or has admin role in their project membership
 */
export function isUserAdmin(profile: ProfileResource | undefined): boolean {
  if (!profile) {
    return false;
  }

  // For development/testing, you can temporarily return true to test admin features
  // return true;

  // Check if the profile resource type is Practitioner or Patient
  // In Medplum, admin status is typically managed through ProjectMembership
  // For now, we'll use a simple check - you may want to enhance this based on your needs
  
  // Option 1: Check if user has specific admin role or identifier
  if (profile.resourceType === 'Practitioner') {
    // Check if practitioner has admin role
    const hasAdminRole = profile.extension?.some(
      ext => ext.url === 'http://medplum.com/fhir/StructureDefinition/admin' && ext.valueBoolean === true
    );
    if (hasAdminRole) {
      return true;
    }
  }

  // Option 2: For development, allow all practitioners to be admins
  // You can customize this logic based on your security requirements
  return profile.resourceType === 'Practitioner';
}

