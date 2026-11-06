import { z } from "zod";
import { optionalTextField, optionalUrlField } from "@/lib/form-data";
import { slugSchema } from "@/lib/slug";

export const placeFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().pipe(slugSchema),
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  summary: optionalTextField,
  address: optionalTextField,
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  imageUrl: optionalUrlField,
  officialUrl: optionalUrlField,
  mapUrl: optionalUrlField,
  isPublished: z.boolean(),
});

export const placeDeleteSchema = z.object({
  id: z.string().uuid(),
  confirmation: z.literal("delete"),
});
