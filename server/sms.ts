import { ENV } from "./_core/env";

export interface SendSMSRequest {
  phoneNumber: string;
  message: string;
}

export interface SendSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
  if (!ENV.twilioAccountSid || !ENV.twilioAuthToken || !ENV.twilioPhoneNumber) {
    console.error("[SMS] Twilio credentials not configured");
    return {
      success: false,
      error: "Twilio credentials not configured",
    };
  }

  try {
    const auth = Buffer.from(
      `${ENV.twilioAccountSid}:${ENV.twilioAuthToken}`
    ).toString("base64");

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ENV.twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: ENV.twilioPhoneNumber,
          To: request.phoneNumber,
          Body: request.message,
        }).toString(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[SMS] Twilio error:", error);
      return {
        success: false,
        error: error.message || "Failed to send SMS",
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.sid,
    };
  } catch (error) {
    console.error("[SMS] Error sending SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send payment confirmation SMS
 */
export async function sendPaymentConfirmationSMS(
  phoneNumber: string,
  credits: number,
  amount: number,
  packageId: string
): Promise<SendSMSResponse> {
  const message = `StyleSwap Payment Confirmed! You've purchased ${credits} try-ons for R${(amount / 100).toFixed(2)}. Your credits are now active. Start creating virtual try-ons at styleswap.co.za`;

  return sendSMS({
    phoneNumber,
    message,
  });
}

/**
 * Send try-on completion SMS
 */
export async function sendTryOnCompletionSMS(
  phoneNumber: string,
  garmentName: string
): Promise<SendSMSResponse> {
  const message = `Your StyleSwap virtual try-on with ${garmentName} is ready! View your results at styleswap.co.za/dashboard`;

  return sendSMS({
    phoneNumber,
    message,
  });
}
