import { JSX, ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useMedplum } from '@medplum/react';
import { isUserAdmin } from '../../utils/permissions';

interface RequireAdminProps {
  children: ReactNode;
}

/**
 * Route protection component that ensures only admin users can access wrapped routes
 * Redirects non-admin users to the home page
 */
export function RequireAdmin({ children }: RequireAdminProps): JSX.Element {
  const medplum = useMedplum();
  const profile = medplum.getProfile();
  
  if (!isUserAdmin(profile)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

