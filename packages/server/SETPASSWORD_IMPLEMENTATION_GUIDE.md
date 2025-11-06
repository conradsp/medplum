# Implementing the `/setpassword` Endpoint for Your EMR Application

## Overview

When Medplum invites a new provider, it generates a password reset URL like:
```
http://localhost:3000/setpassword/{id}/{secret}
```

This page allows the new user to set their password. You need to implement this in your EMR application's frontend.

## How It Works

### Backend Flow (Already Handled by Medplum)

1. **Invitation Created**: When `inviteUser()` is called, it creates a `UserSecurityRequest` resource with:
   - `id`: UUID of the security request
   - `secret`: Random secure token
   - `type`: 'invite' or 'reset'
   - `user`: Reference to the User resource
   - `used`: false (initially)

2. **URL Generated**: The server creates the URL:
   ```typescript
   concatUrls(config.appBaseUrl, `setpassword/${id}/${secret}`)
   ```

3. **Email Sent**: The URL is sent to the user via email

4. **API Endpoint Available**: The server exposes `POST /auth/setpassword` which:
   - Validates the `id` and `secret`
   - Checks if the request was already used
   - Validates the password (min 8 chars, not in breach database)
   - Updates the user's password
   - Marks the request as used

### Frontend Implementation (What You Need to Build)

## Option 1: Use Medplum React Components (Recommended)

If your EMR uses React, you can simply copy the Medplum implementation:

### Step 1: Create SetPasswordPage Component

```tsx
// src/pages/SetPasswordPage.tsx
import { Button, Center, Group, PasswordInput, Stack, Title } from '@mantine/core';
import { badRequest, normalizeOperationOutcome } from '@medplum/core';
import type { OperationOutcome } from '@medplum/fhirtypes';
import {
  Document,
  Form,
  Logo,
  MedplumLink,
  OperationOutcomeAlert,
  getErrorsForInput,
  getIssuesForExpression,
  useMedplum,
} from '@medplum/react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

export function SetPasswordPage() {
  const { id, secret } = useParams<{ id: string; secret: string }>();
  const medplum = useMedplum();
  const [outcome, setOutcome] = useState<OperationOutcome>();
  const [success, setSuccess] = useState(false);
  const issues = getIssuesForExpression(outcome, undefined);

  return (
    <Document width={450}>
      <OperationOutcomeAlert issues={issues} />
      <Form
        onSubmit={(formData: Record<string, string>) => {
          if (formData.password !== formData.confirmPassword) {
            setOutcome(badRequest('Passwords do not match', 'confirmPassword'));
            return;
          }
          setOutcome(undefined);
          const body = {
            id,
            secret,
            password: formData.password,
          };
          medplum
            .post('auth/setpassword', body)
            .then(() => setSuccess(true))
            .catch((err) => setOutcome(normalizeOperationOutcome(err)));
        }}
      >
        <Center style={{ flexDirection: 'column' }}>
          <Logo size={32} />
          <Title>Set password</Title>
        </Center>
        {!success && (
          <Stack>
            <PasswordInput
              name="password"
              label="New password"
              required={true}
              error={getErrorsForInput(outcome, 'password')}
            />
            <PasswordInput
              name="confirmPassword"
              label="Confirm new password"
              required={true}
              error={getErrorsForInput(outcome, 'confirmPassword')}
            />
            <Group justify="flex-end" mt="xl">
              <Button type="submit">Set password</Button>
            </Group>
          </Stack>
        )}
        {success && (
          <div data-testid="success">
            Password set. You can now <MedplumLink to="/signin">sign in</MedplumLink>.
          </div>
        )}
      </Form>
    </Document>
  );
}
```

### Step 2: Add Route to Your Router

```tsx
// In your App.tsx or Routes.tsx
import { Route } from 'react-router-dom';
import { SetPasswordPage } from './pages/SetPasswordPage';

// Add this route:
<Route path="/setpassword/:id/:secret" element={<SetPasswordPage />} />
```

### Step 3: Install Required Dependencies

```bash
npm install @medplum/react @mantine/core @mantine/hooks
```

## Option 2: Custom Implementation (Without Medplum React)

If you're not using React or prefer a custom implementation:

### Step 1: Create the Page/Component

```typescript
// Pseudocode for any framework
function SetPasswordPage() {
  // 1. Extract id and secret from URL parameters
  const { id, secret } = getUrlParams(); // /setpassword/:id/:secret
  
  // 2. Create form with two password fields
  const form = {
    password: '',
    confirmPassword: ''
  };
  
  // 3. On form submit:
  async function handleSubmit() {
    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    
    // Validate password length
    if (form.password.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }
    
    // Send to Medplum API
    try {
      const response = await fetch('http://localhost:8103/auth/setpassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          secret: secret,
          password: form.password
        })
      });
      
      if (response.ok) {
        showSuccess('Password set successfully! You can now sign in.');
        // Redirect to sign in page
        redirectTo('/signin');
      } else {
        const error = await response.json();
        showError(error.issue[0].details.text);
      }
    } catch (error) {
      showError('Failed to set password. Please try again.');
    }
  }
}
```

### Step 2: Example HTML Template

```html
<!DOCTYPE html>
<html>
<head>
  <title>Set Password - Your EMR</title>
  <style>
    .container {
      max-width: 400px;
      margin: 50px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input[type="password"] {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      width: 100%;
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .error {
      color: red;
      margin-bottom: 10px;
    }
    .success {
      color: green;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Set Your Password</h2>
    <div id="message"></div>
    <form id="setPasswordForm">
      <div class="form-group">
        <label for="password">New Password</label>
        <input type="password" id="password" name="password" required minlength="8">
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input type="password" id="confirmPassword" name="confirmPassword" required minlength="8">
      </div>
      <button type="submit">Set Password</button>
    </form>
  </div>

  <script>
    // Extract id and secret from URL
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 2];
    const secret = pathParts[pathParts.length - 1];
    
    document.getElementById('setPasswordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const messageDiv = document.getElementById('message');
      
      // Clear previous messages
      messageDiv.innerHTML = '';
      
      // Validate passwords match
      if (password !== confirmPassword) {
        messageDiv.innerHTML = '<div class="error">Passwords do not match</div>';
        return;
      }
      
      // Send to Medplum API
      try {
        const response = await fetch('http://localhost:8103/auth/setpassword', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: id,
            secret: secret,
            password: password
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          messageDiv.innerHTML = '<div class="success">Password set successfully! Redirecting to sign in...</div>';
          setTimeout(() => {
            window.location.href = '/signin';
          }, 2000);
        } else {
          const errorMessage = result.issue?.[0]?.details?.text || 'Failed to set password';
          messageDiv.innerHTML = `<div class="error">${errorMessage}</div>`;
        }
      } catch (error) {
        messageDiv.innerHTML = '<div class="error">Failed to set password. Please try again.</div>';
      }
    });
  </script>
</body>
</html>
```

## API Request/Response Details

### Request to `POST /auth/setpassword`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "secret": "abc123xyz789",
  "password": "MySecurePassword123!"
}
```

### Success Response (200 OK)

```json
{
  "resourceType": "OperationOutcome",
  "id": "allok",
  "issue": [
    {
      "severity": "information",
      "code": "informational",
      "details": {
        "text": "All OK"
      }
    }
  ]
}
```

### Error Response (400 Bad Request)

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "invalid",
      "details": {
        "text": "Incorrect secret"
      },
      "expression": ["secret"]
    }
  ]
}
```

## Common Error Messages

- **"Already used"**: The password reset link has already been used
- **"Incorrect secret"**: The secret token doesn't match
- **"Invalid password, must be at least 8 characters"**: Password too short
- **"Password found in breach database"**: Password is compromised (using haveibeenpwned.com API)
- **"Invalid request ID"**: The ID is not a valid UUID

## Testing

### 1. Trigger an Invite

Use your existing invite flow to create a provider, which will generate the email with the setpassword URL.

### 2. Manual Testing

You can manually create a UserSecurityRequest via the Medplum API:

```bash
POST http://localhost:8103/fhir/R4/UserSecurityRequest
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "resourceType": "UserSecurityRequest",
  "type": "invite",
  "user": {
    "reference": "User/YOUR_USER_ID"
  },
  "secret": "test-secret-123"
}
```

Then visit: `http://localhost:3000/setpassword/{returned-id}/test-secret-123`

## Security Considerations

1. **One-Time Use**: The secret can only be used once. After password is set, the UserSecurityRequest is marked as `used: true`

2. **Secret Validation**: The server uses timing-safe string comparison to prevent timing attacks

3. **Password Requirements**:
   - Minimum 8 characters
   - Checked against haveibeenpwned.com breach database
   - Hashed with bcrypt before storage

4. **HTTPS**: In production, always use HTTPS for the password reset page

5. **Expiration**: Consider adding expiration checking (Medplum doesn't enforce this by default, but you can add it)

## Customization Options

### Change the URL Path

If you want to use a different URL path (e.g., `/welcome` instead of `/setpassword`), you need to:

1. Update your frontend route
2. Update the `appBaseUrl` config or modify the invite email template

### Custom Email Template

To customize the email that includes the setpassword link, modify the `sendInviteEmail()` function in:
`packages/server/src/admin/invite.ts`

### Add Expiration

You can add expiration by checking the `UserSecurityRequest.meta.lastUpdated` field and rejecting requests older than X hours.

## Next Steps

1. Implement the `/setpassword/:id/:secret` route in your EMR
2. Test with a new provider invitation
3. Verify the password is set correctly and user can sign in
4. Customize styling to match your EMR's design system

## Need Help?

- Check the Medplum source code: `packages/app/src/SetPasswordPage.tsx`
- Review the API endpoint: `packages/server/src/auth/setpassword.ts`
- Test the flow in the official Medplum app: https://app.medplum.com/setpassword/{id}/{secret}
