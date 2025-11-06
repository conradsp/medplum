# Email Debugging Guide for Amazon SES

## Overview
Enhanced debugging has been added to track email sending through Amazon SES when creating new providers. This guide explains what to look for in the logs.

## Configuration Check

Based on your `medplum.config.json`, you have SMTP configured:
- **Host**: email-smtp.us-east-1.amazonaws.com
- **Port**: 587
- **Username**: AKIAZY5FIFEOZ454GPUD

### Important Configuration Notes:

Since you have `smtp` configured in your config, the system will **use SMTP** instead of the direct AWS SES API. The logic in `sendEmail()` is:

1. **If `config.smtp` exists** → Use SMTP (nodemailer)
2. **Else if `config.emailProvider === 'awsses'`** → Use AWS SES API
3. **Else** → No email provider configured

## What to Look For in Logs

When you create a new provider, you should see these log entries in sequence:

### 1. Invite Email Preparation
```
Preparing to send invite email
{
  userId: "...",
  email: "...",
  projectId: "...",
  projectName: "...",
  existingUser: false
}
```

### 2. Email Composition
```
Attempting to send invite email
{
  to: "...",
  subject: "Welcome to Medplum" (or "Medplum: Welcome to {projectName}")
}
```

### 3. Email Provider Selection
```
Sending email
{
  to: "...",
  subject: "...",
  from: "..."
}

Email provider: SMTP
{
  host: "email-smtp.us-east-1.amazonaws.com",
  port: 587,
  username: "AKIAZY5FIFEOZ454GPUD",
  hasPassword: true
}
```

### 4. SMTP Transport Creation
```
Creating SMTP transport
{
  host: "email-smtp.us-east-1.amazonaws.com",
  port: 587,
  username: "AKIAZY5FIFEOZ454GPUD"
}
```

### 5. SMTP Email Sending
```
Sending email via SMTP
{
  to: "...",
  from: "...",
  subject: "..."
}
```

### 6. Success or Failure

#### Success:
```
SMTP email sent successfully
{
  messageId: "...",
  accepted: [...],
  rejected: [],
  response: "250 Ok ..."
}

Email sent successfully
{
  to: "...",
  subject: "..."
}

Invite email sent successfully
{
  to: "...",
  subject: "..."
}
```

#### Failure:
```
Failed to send email via SMTP
{
  error: "...",
  errorStack: "...",
  host: "email-smtp.us-east-1.amazonaws.com",
  port: 587,
  username: "AKIAZY5FIFEOZ454GPUD"
}

Failed to send invite email
{
  to: "...",
  subject: "...",
  error: "..."
}
```

## Common Issues and Solutions

### Issue 1: Email Not Reaching SES
**Symptom**: Logs stop before "Sending email via SMTP"

**Possible Causes**:
- Code never reaches the invite email function
- Email sending is disabled (`sendEmail: false` in request)
- Error occurs before email sending

### Issue 2: SMTP Authentication Failure
**Symptom**: Error like "Invalid login" or "Authentication failed"

**Possible Causes**:
- Incorrect SMTP credentials
- SMTP password needs to be regenerated in AWS
- AWS SES credentials expired

**Solution**:
1. Verify SMTP credentials in AWS SES Console
2. Generate new SMTP credentials if needed
3. Update `medplum.config.json` with new credentials

### Issue 3: Connection Timeout
**Symptom**: Error like "Connection timeout" or "ETIMEDOUT"

**Possible Causes**:
- Firewall blocking port 587
- Network connectivity issues
- Wrong SMTP endpoint for your region

**Solution**:
1. Test connectivity: `telnet email-smtp.us-east-1.amazonaws.com 587`
2. Check firewall rules
3. Verify you're using the correct regional endpoint

### Issue 4: Email Not Verified in SES
**Symptom**: Error like "Email address is not verified"

**Possible Causes**:
- AWS SES is in sandbox mode
- Sender email not verified
- Recipient email not verified (in sandbox mode)

**Solution**:
1. Verify sender email in AWS SES Console
2. Request production access (move out of sandbox)
3. Or verify recipient emails for testing

### Issue 5: Wrong Email Provider Selected
**Symptom**: Logs show "Email provider: AWS SES" but you want SMTP

**Possible Causes**:
- `smtp` config is missing or undefined
- `emailProvider` is set to 'awsses'

**Solution**:
Ensure your `medplum.config.json` has the `smtp` block properly configured (it currently does).

## Testing Email Configuration

To test your email setup:

1. **Check server logs** when creating a provider
2. **Look for the sequence** of log messages above
3. **Identify where it fails** if emails aren't being sent
4. **Check AWS SES Console** for bounces/complaints

## Debugging Commands

### View real-time logs:
```bash
cd /Users/steveconrad/WebProjects/medplum/medplum/packages/server
npm run dev
```

### Test SMTP connection manually:
```bash
telnet email-smtp.us-east-1.amazonaws.com 587
```

### Check SES sandbox status (AWS CLI):
```bash
aws sesv2 get-account --region us-east-1
```

## Modified Files

The following files have been enhanced with debugging:

1. **`packages/server/src/admin/invite.ts`**
   - Added logging for invite email preparation
   - Added logging for success/failure of email sending
   - Added error details to logs

2. **`packages/server/src/email/email.ts`**
   - Added logging for email provider selection (SMTP vs SES)
   - Added detailed SMTP configuration logging
   - Added success/failure logging for SMTP
   - Added warning when no email provider is configured

3. **`packages/server/src/cloud/aws/email.ts`**
   - Added logging for AWS SES preparation
   - Added logging for raw message building
   - Added detailed error logging for SES failures
   - Added success logging with message ID

## Next Steps

1. **Restart your server** to pick up the logging changes
2. **Create a test provider** and watch the logs
3. **Identify the specific point** where the email flow breaks
4. **Use the logs** to diagnose the issue
5. **Check AWS SES Dashboard** for additional insights

If you still don't see emails reaching SES after adding this debugging, share the log output and we can identify the exact issue!
