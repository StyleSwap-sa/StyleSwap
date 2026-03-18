import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Upload,
  CheckCircle2,
  Clock,
  FileText,
  X,
  Plus,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

/**
 * Fraud Appeal Flow Component
 * Allows boutiques to appeal fraud flags with evidence submission
 */

interface AppealStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export default function FraudAppealFlow() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFlag, setSelectedFlag] = useState<string>('');
  const [appealReason, setAppealReason] = useState('');
  const [evidence, setEvidence] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch fraud flags
  const { data: fraudFlags, isLoading } = trpc.verification.getFraudFlags.useQuery(
    { boutiqueId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Submit appeal mutation
  const { mutate: submitAppeal } = trpc.verification.submitFraudAppeal.useMutation({
    onSuccess: () => {
      setSubmitSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard/verification/appeals';
      }, 2000);
    },
  });

  const steps: AppealStep[] = [
    {
      id: 1,
      title: 'Select Flag',
      description: 'Choose which fraud flag you want to appeal',
      completed: !!selectedFlag,
    },
    {
      id: 2,
      title: 'Explain',
      description: 'Provide your explanation for the appeal',
      completed: appealReason.length > 20,
    },
    {
      id: 3,
      title: 'Evidence',
      description: 'Upload supporting documents or evidence',
      completed: evidence.length > 0,
    },
    {
      id: 4,
      title: 'Review',
      description: 'Review and submit your appeal',
      completed: false,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      // Validate file type
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} has an invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX`);
        return false;
      }
      return true;
    });

    setEvidence([...evidence, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedFlag || appealReason.length < 20 || evidence.length === 0) {
      alert('Please complete all steps before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload evidence files
      const uploadedFiles = [];
      for (const file of evidence) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedFiles.push({
            filename: file.name,
            url: data.url,
            type: file.type,
          });
        }
      }

      // Submit appeal
      submitAppeal({
        fraudFlagId: parseInt(selectedFlag),
        reason: appealReason,
        evidence: uploadedFiles,
      });
    } catch (error) {
      console.error('Error submitting appeal:', error);
      alert('Failed to submit appeal. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!fraudFlags || fraudFlags.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Active Fraud Flags</h2>
            <p className="text-muted-foreground">
              Your boutique doesn't have any active fraud flags. Keep up the good work!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Appeal Fraud Flag</h1>
        <p className="text-muted-foreground mt-2">
          If you believe a fraud flag on your account is incorrect, you can appeal it here.
        </p>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your appeal has been submitted successfully. You'll be notified when a decision is made.
          </AlertDescription>
        </Alert>
      )}

      {/* Steps */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`p-3 rounded-lg text-center cursor-pointer transition ${
              currentStep === step.id
                ? 'bg-primary text-white'
                : step.completed
                ? 'bg-green-100 text-green-900'
                : 'bg-muted text-muted-foreground'
            }`}
            onClick={() => setCurrentStep(step.id)}
          >
            <div className="font-bold">{step.id}</div>
            <div className="text-xs">{step.title}</div>
          </div>
        ))}
      </div>

      {/* Step 1: Select Flag */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Fraud Flag</CardTitle>
            <CardDescription>Choose which fraud flag you want to appeal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fraudFlags.map((flag: any) => (
              <div
                key={flag.id}
                className={`p-4 border rounded-lg cursor-pointer transition ${
                  selectedFlag === flag.id.toString()
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedFlag(flag.id.toString())}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold">{flag.flagType}</h3>
                    <p className="text-sm text-muted-foreground">{flag.reason}</p>
                  </div>
                  <Badge variant={selectedFlag === flag.id.toString() ? 'default' : 'outline'}>
                    {flag.severity}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Flagged on {new Date(flag.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Explain */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Explain Your Appeal</CardTitle>
            <CardDescription>
              Provide a detailed explanation of why you believe this flag is incorrect
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Appeal Reason</label>
              <Textarea
                placeholder="Please explain why you believe this fraud flag is incorrect. Be as detailed as possible..."
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground mt-2">
                Minimum 20 characters. {appealReason.length} / 2000
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Be honest and specific. Appeals with false information may result in account suspension.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Evidence */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Evidence</CardTitle>
            <CardDescription>
              Upload documents or files that support your appeal (PDF, JPG, PNG, DOC, DOCX)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Area */}
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium mb-1">Drop files here or click to upload</p>
              <p className="text-xs text-muted-foreground mb-4">
                Maximum 10MB per file. Supported: PDF, JPG, PNG, DOC, DOCX
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="evidence-upload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('evidence-upload')?.click()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Select Files
              </Button>
            </div>

            {/* Uploaded Files */}
            {evidence.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Files ({evidence.length})</h4>
                {evidence.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure your evidence clearly supports your appeal. Blurry or unclear documents may not be accepted.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Your Appeal</CardTitle>
            <CardDescription>Please review the information before submitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Flag */}
            <div>
              <h4 className="font-medium mb-2">Fraud Flag</h4>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  {fraudFlags.find((f: any) => f.id.toString() === selectedFlag)?.flagType}
                </p>
              </div>
            </div>

            {/* Appeal Reason */}
            <div>
              <h4 className="font-medium mb-2">Appeal Reason</h4>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{appealReason}</p>
              </div>
            </div>

            {/* Evidence */}
            <div>
              <h4 className="font-medium mb-2">Evidence Files</h4>
              <div className="space-y-2">
                {evidence.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                By submitting this appeal, you confirm that all information provided is accurate and truthful.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!steps[currentStep - 1].completed}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Submitting...
              </>
            ) : (
              'Submit Appeal'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
