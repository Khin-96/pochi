import { z } from "zod";

const phoneRegex = /^(?:(?:\+?254)|(?:0)|(?:254))?(7\d{8})$/;

export const sendMoneySchema = z.object({
  recipientType: z.enum(["phone", "email"]),
  recipientPhone: z.string()
    .min(1, "Phone number is required")
    .regex(phoneRegex, "Invalid Kenyan phone number")
    .optional(),
  recipientEmail: z.string()
    .email("Invalid email address")
    .optional(),
  amount: z.union([
    z.string()
      .min(1, "Amount is required")
      .refine(val => !isNaN(parseFloat(val)), "Must be a number")
      .refine(val => parseFloat(val) > 0, "Amount must be positive"),
    z.number()
      .positive("Amount must be positive")
  ]),
  description: z.string().max(100, "Description too long").optional(),
}).superRefine((data, ctx) => {
  if (data.recipientType === "phone" && !data.recipientPhone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Phone number is required",
      path: ["recipientPhone"]
    });
  }
  
  if (data.recipientType === "email" && !data.recipientEmail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Email is required",
      path: ["recipientEmail"]
    });
  }
});