import { z } from "zod";

import { addCarFormSchema } from "@/entities/car";

export const editCarBasicsFormSchema = addCarFormSchema.pick({
  brand: true,
  model: true,
  color: true,
});

export type EditCarBasicsFormOutput = z.infer<typeof editCarBasicsFormSchema>;
