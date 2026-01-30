import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [, params] = useRoute("/verify-boutique/:token");
  const [, setLocation] = useLocation();
  const token = params?.token || "";

  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const verifyMutation = trpc.boutiques.verifyEmail.useMutation({
    onSuccess: () => {
      setVerificationStatus("success");
      // Redirect to boutique dashboard after 3 seconds
      setTimeout(() => {
        setLocation("/boutique-dashboard");
      }, 3000);
    },
    onError: (error) => {
      setVerificationStatus("error");
      setErrorMessage(error.message);
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    } else {
      setVerificationStatus("error");
      setErrorMessage("Invalid verification link");
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {verificationStatus === "loading" && (
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            )}
            {verificationStatus === "success" && (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            )}
            {verificationStatus === "error" && (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {verificationStatus === "loading" && "Verifying Your Email"}
            {verificationStatus === "success" && "Email Verified!"}
            {verificationStatus === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {verificationStatus === "loading" && "Please wait while we verify your email address..."}
            {verificationStatus === "success" && "Your boutique email has been successfully verified."}
            {verificationStatus === "error" && "We couldn't verify your email address."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationStatus === "success" && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Your boutique is now active! You'll be redirected to your dashboard in a few seconds.
              </AlertDescription>
            </Alert>
          )}

          {verificationStatus === "error" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3">
            {verificationStatus === "success" && (
              <Button onClick={() => setLocation("/boutique-dashboard")} className="w-full">
                Go to Dashboard
              </Button>
            )}

            {verificationStatus === "error" && (
              <Button onClick={() => setLocation("/")} variant="outline" className="w-full">
                Return to Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
