import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().trim().min(1).max(180),
  markdown: z.string().trim().min(1).max(40_000),
});

export const flashcardSchema = z.object({
  title: z.string().trim().min(1).max(180),
  cards: z
    .array(
      z.object({
        front: z.string().trim().min(1).max(500),
        back: z.string().trim().min(1).max(1_200),
      }),
    )
    .min(1)
    .max(40),
});

export const quizSchema = z.object({
  title: z.string().trim().min(1).max(180),
  questions: z
    .array(
      z.object({
        type: z.enum(["mcq", "true_false", "short_answer"]),
        prompt: z.string().trim().min(1).max(900),
        options: z.array(z.string().trim().max(300)).max(6),
        answer: z.string().trim().min(1).max(600),
        acceptable: z.array(z.string().trim().max(300)).max(4),
        explanation: z.string().trim().min(1).max(900),
        topic: z.string().trim().min(1).max(80),
      }),
    )
    .min(1)
    .max(40),
});

export const tutorSchema = z.object({
  reply: z.string().trim().min(1).max(8_000),
  beyondSource: z.boolean(),
});

export const plannerSchema = z.object({
  title: z.string().trim().min(1).max(160),
  tasks: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        subject: z.string().trim().min(1).max(80),
        title: z.string().trim().min(1).max(200),
        kind: z.enum(["study", "revision"]),
      }),
    )
    .min(1)
    .max(60),
});

export const noteJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "markdown"],
  properties: {
    title: { type: "string" },
    markdown: { type: "string" },
  },
};

export const flashcardJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "cards"],
  properties: {
    title: { type: "string" },
    cards: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["front", "back"],
        properties: {
          front: { type: "string" },
          back: { type: "string" },
        },
      },
    },
  },
};

export const quizJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "questions"],
  properties: {
    title: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "prompt", "options", "answer", "acceptable", "explanation", "topic"],
        properties: {
          type: { type: "string", enum: ["mcq", "true_false", "short_answer"] },
          prompt: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          answer: { type: "string" },
          acceptable: { type: "array", items: { type: "string" } },
          explanation: { type: "string" },
          topic: { type: "string" },
        },
      },
    },
  },
};

export const tutorJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "beyondSource"],
  properties: {
    reply: { type: "string" },
    beyondSource: { type: "boolean" },
  },
};

export const plannerJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "tasks"],
  properties: {
    title: { type: "string" },
    tasks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["date", "subject", "title", "kind"],
        properties: {
          date: { type: "string" },
          subject: { type: "string" },
          title: { type: "string" },
          kind: { type: "string", enum: ["study", "revision"] },
        },
      },
    },
  },
};
