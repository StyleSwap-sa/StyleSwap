# StyleSwap Twilio OTP Integration Guide

## Overview

This document provides instructions for setting up and using the Twilio OTP (One-Time Password) authentication system for StyleSwap. The integration uses Twilio Verify v2 API for secure SMS-based OTP delivery and verification.

## Architecture

### Components

1. **Twilio Helper** (`server/_core/twilio.ts`)
   - Phone number validation and normalization
   - OTP sending via Twilio Verify
   - OTP verification
   - Error handling and rate limiting

2. **OTP Router** (`server/routers/otp.ts`)
   - `sendOTP`: Send OTP to phone number
   - `verifyOTP`: Verify OTP and create session
   - `getSessionInfo`: Get current user session
   - `updatePhoneNumber`: Update user's phone number

3. **Database Integration**
   - Uses existing `users` table with `phone` field
   - Stores user sessions via cookies

## Environment Variables

Required environment variables for Twilio integration:

```env
# Twilio Account Credentials
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid

# Twilio Billing Configuration
# Account should have:
# - $20 prepaid starting balance
# - Auto-recharge OFF
# - Daily spend limit: $2-$3
# - Monthly/account spend limit: $20
```

### Getting Twilio Credentials

1. **Create Twilio Account**
   - Visit https://www.twilio.com/console
   - Sign up for a new account

2. **Find Account SID and Auth Token**
   - Go to Twilio Console Dashboard
   - Copy `Account SID` and `Auth Token`

3. **Create Verify Service**
   - Go to Verify > Services
   - Click "Create new Service"
   - Name it "StyleSwap OTP"
   - Copy the `Service SID`

4. **Configure Billing**
   - Go to Account > Billing
   - Set up prepaid balance ($20 minimum)
   - Disable auto-recharge
   - Set daily spend limit to $2-$3
   - Set monthly spend limit to $20

## API Endpoints

### 1. Send OTP

**Endpoint:** `POST /api/trpc/otp.sendOTP`

**Request:**
```json
{
  "phoneNumber": "0123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "verificationSid": "VExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Phone Number Formats Accepted:**
- `0123456789` (South African format)
- `+27123456789` (E.164 format)
- `(012) 345-6789` (Formatted)
- `27123456789` (With country code)

### 2. Verify OTP

**Endpoint:** `POST /api/trpc/otp.verifyOTP`

**Request:**
```json
{
  "phoneNumber": "0123456789",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "user": {
    "id": 123,
    "phone": "+27123456789",
    "email": "phone_27123456789@styleswap.local",
    "name": "User +27123456789"
  }
}
```

**Session:** A session cookie is automatically created upon successful verification.

### 3. Get Session Info

**Endpoint:** `GET /api/trpc/otp.getSessionInfo`

**Authentication:** Required (session cookie)

**Response:**
```json
{
  "userId": 123,
  "phone": "+27123456789",
  "email": "phone_27123456789@styleswap.local",
  "name": "User +27123456789"
}
```

### 4. Update Phone Number

**Endpoint:** `POST /api/trpc/otp.updatePhoneNumber`

**Authentication:** Required (session cookie)

**Request:**
```json
{
  "newPhoneNumber": "0987654321",
  "code": "654321"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number updated successfully",
  "phone": "+27987654321"
}
```

## Security Features

### 1. Rate Limiting

- **Limit:** 3 OTP requests per phone number per 15 minutes
- **Implementation:** In-memory rate limiting (upgrade to Redis for production)
- **Error:** `TOO_MANY_REQUESTS` when limit exceeded

### 2. Phone Number Validation

- **Format:** E.164 international format (+[country code][number])
- **Validation:** Regex pattern ensures valid format
- **Normalization:** Automatically converts South African formats to E.164

### 3. OTP Code Validation

- **Format:** 4-8 digits (typically 6)
- **Expiration:** Managed by Twilio Verify (default 10 minutes)
- **Verification:** Only Twilio can verify codes (no local storage)

### 4. Session Management

- **Duration:** 30 days
- **Storage:** HTTP-only cookies
- **Security:** Secure flag enabled on HTTPS connections

### 5. User Creation

- **Auto-creation:** New users are automatically created on first OTP verification
- **Email:** Temporary email generated from phone number
- **Role:** Default role is 'user'
- **Login Method:** Set to 'otp'

## Error Handling

### Common Errors

| Error Code | Message | Cause | Solution |
|-----------|---------|-------|----------|
| `BAD_REQUEST` | Invalid phone number format | Phone number doesn't match E.164 | Use valid format: +27123456789 |
| `TOO_MANY_REQUESTS` | Too many OTP requests | Exceeded rate limit | Wait 15 minutes before retrying |
| `UNAUTHORIZED` | Invalid or expired OTP code | Wrong code or expired | Request new OTP |
| `CONFLICT` | Phone number is already in use | Phone already registered | Use different phone number |
| `INTERNAL_SERVER_ERROR` | OTP service is not configured | Missing Twilio credentials | Check environment variables |
| `INTERNAL_SERVER_ERROR` | Database connection unavailable | Database not connected | Check database connection |

## Testing

### Unit Tests

Run OTP tests:
```bash
pnpm test server/routers/otp.test.ts
```

### Manual Testing

1. **Send OTP:**
```bash
curl -X POST http://localhost:3000/api/trpc/otp.sendOTP \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "0123456789"}'
```

2. **Verify OTP:**
```bash
curl -X POST http://localhost:3000/api/trpc/otp.verifyOTP \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "0123456789", "code": "123456"}'
```

### Test Phone Numbers

For Twilio Verify testing, use these phone numbers:
- `+15005550006` - Verification code will always be `000000`
- `+15005550007` - Verification will fail
- `+15005550008` - Verification will timeout
- `+15005550009` - Verification will succeed with any code

## Frontend Integration

### React Example

```typescript
import { trpc } from '@/lib/trpc';

export function OTPLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');

  const sendOTP = trpc.otp.sendOTP.useMutation({
    onSuccess: () => setStep('code'),
    onError: (error) => alert(error.message),
  });

  const verifyOTP = trpc.otp.verifyOTP.useMutation({
    onSuccess: (data) => {
      // User is now logged in
      window.location.href = '/dashboard';
    },
    onError: (error) => alert(error.message),
  });

  return (
    <div>
      {step === 'phone' ? (
        <div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
          />
          <button onClick={() => sendOTP.mutate({ phoneNumber })}>
            Send OTP
          </button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter OTP code"
          />
          <button onClick={() => verifyOTP.mutate({ phoneNumber, code })}>
            Verify OTP
          </button>
        </div>
      )}
    </div>
  );
}
```

## Monitoring & Logging

### Logs to Monitor

1. **OTP Send Events**
   ```
   [Twilio OTP] Sent OTP to +27123456789
   [Twilio OTP] Verification SID: VExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **OTP Verification Events**
   ```
   [Twilio OTP] Verified OTP for +27123456789
   [Twilio OTP] User created/logged in: ID 123
   ```

3. **Error Events**
   ```
   [Twilio OTP] Error sending OTP: Invalid phone number
   [Twilio OTP] Error verifying OTP: Invalid or expired code
   ```

### Twilio Dashboard Monitoring

1. Go to Twilio Console > Verify > Logs
2. View all OTP send and verification attempts
3. Check delivery status and failure reasons
4. Monitor account balance and usage

## Billing Considerations

### Cost Estimates

- **OTP SMS:** $0.01 - $0.05 per SMS (varies by country)
- **South Africa:** ~$0.01 per SMS
- **Monthly Budget:** $20 (covers ~2000 OTP sends)

### Cost Optimization

1. **Reuse Verification SID:** Don't send multiple OTPs for same phone
2. **Longer Expiry:** Increase OTP expiry to reduce resend requests
3. **Rate Limiting:** Prevent abuse with strict rate limits
4. **Monitoring:** Track failed verifications to identify issues

## Troubleshooting

### OTP Not Received

1. Check phone number format
2. Verify Twilio account has sufficient balance
3. Check Twilio Logs for delivery failures
4. Ensure SMS is not filtered as spam

### Verification Fails

1. Confirm code hasn't expired (default 10 minutes)
2. Check code is entered correctly
3. Verify phone number matches OTP request
4. Check Twilio Logs for verification errors

### High Costs

1. Implement stricter rate limiting
2. Increase OTP expiry time
3. Monitor for abuse patterns
4. Set daily/monthly spend limits

## Production Checklist

- [ ] Twilio credentials configured in production environment
- [ ] Billing limits set ($2-$3 daily, $20 monthly)
- [ ] Auto-recharge disabled
- [ ] Rate limiting upgraded to Redis
- [ ] Error logging configured
- [ ] Monitoring alerts set up
- [ ] User testing completed
- [ ] Documentation updated
- [ ] Backup phone verification method available
- [ ] Disaster recovery plan in place

## Future Enhancements

1. **WhatsApp OTP:** Add WhatsApp as OTP channel
2. **Voice OTP:** Support voice calls for OTP delivery
3. **Email OTP:** Fallback to email if SMS fails
4. **Backup Codes:** Generate backup codes for account recovery
5. **2FA:** Implement two-factor authentication
6. **SMS History:** Store OTP send history for audit
7. **Custom Messages:** Allow customizable OTP message templates

## Support

For issues or questions:
1. Check Twilio documentation: https://www.twilio.com/docs/verify
2. Review error logs in Twilio Console
3. Contact Twilio support: https://support.twilio.com
4. Check StyleSwap documentation and logs
