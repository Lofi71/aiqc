import { z } from 'zod';

// Zod schemas for streaming validation
export const coordinatesSchema = z.object({
    top: z.number(),
    left: z.number(),
    width: z.number(),
    height: z.number(),
});

export const feedbackItemSchema = z.object({
    id: z.number(),
    type: z.string(),
    severity: z.enum(['High', 'Medium', 'Low']),
    _reasoning: z.string().optional(), // Chain-of-Thought field
    title: z.string(),
    description: z.string(),
    action_plan: z.string(),
    box_2d: z.array(z.number()).length(4),
});

export const analysisResultSchema = z.object({
    score: z.number().min(0).max(100),
    summary: z.string(),
    feedback_list: z.array(feedbackItemSchema),
});

export type AnalysisResultZod = z.infer<typeof analysisResultSchema>;
