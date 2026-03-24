import { api } from "@/services/api";

export async function askAssistant(message: string, preferences?: Record<string, unknown>) {
  const { data } = await api.post("/ai/assistant", { message, preferences });
  return data;
}
