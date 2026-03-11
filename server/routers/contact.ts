import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  company: z.string().min(1, "Company is required"),
  phone: z.string().min(1, "Phone is required"),
  inquiryType: z.enum(["general", "enterprise", "integration", "support"]),
  businessType: z.enum(["boutique", "fastfashion", "luxury", "ecommerce", "other"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const contactRouter = router({
  submitInquiry: publicProcedure
    .input(contactFormSchema)
    .mutation(async ({ input }) => {
      try {
        // Map inquiry type to readable format
        const inquiryTypeMap = {
          general: "General Inquiry",
          enterprise: "Enterprise Sales",
          integration: "API Integration",
          support: "Support",
        };

        const businessTypeMap = {
          boutique: "Fashion Boutique",
          fastfashion: "Fast Fashion Retailer",
          luxury: "Luxury Brand",
          ecommerce: "E-commerce Store",
          other: "Other",
        };

        const inquiryTypeLabel = inquiryTypeMap[input.inquiryType];
        const businessTypeLabel = businessTypeMap[input.businessType];

        // Prepare email content
        const emailContent = `
New Contact Form Submission

Name: ${input.name}
Email: ${input.email}
Company: ${input.company}
Phone: ${input.phone}
Inquiry Type: ${inquiryTypeLabel}
Business Type: ${businessTypeLabel}

Message:
${input.message}

---
Submitted at: ${new Date().toISOString()}
        `.trim();

        // Send notification to owner
        const notificationSuccess = await notifyOwner({
          title: `New ${inquiryTypeLabel} from ${input.name}`,
          content: emailContent,
        });

        // For enterprise sales inquiries, also send to sales email
        if (input.inquiryType === "enterprise") {
          try {
            // You can add additional email sending logic here if needed
            // For now, the owner notification will be the primary alert
            console.log("[Contact] Enterprise sales inquiry received from:", input.email);
          } catch (error) {
            console.error("[Contact] Error processing enterprise inquiry:", error);
          }
        }

        return {
          success: true,
          message: "Your inquiry has been submitted successfully. We'll get back to you soon!",
          notificationSent: notificationSuccess,
        };
      } catch (error) {
        console.error("[Contact] Error submitting inquiry:", error);
        return {
          success: false,
          message: "Failed to submit inquiry. Please try again later.",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
});
