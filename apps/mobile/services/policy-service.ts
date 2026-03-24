import { api } from "@/services/api";

export type PolicySection = {
  title: string;
  body: string;
};

export type PolicyPage = {
  key: "privacy" | "terms" | "refunds";
  title: string;
  subtitle: string;
  sections: PolicySection[];
};

export async function fetchPolicyPage(policyKey: PolicyPage["key"]) {
  const { data } = await api.get(`/policies/${policyKey}`);
  return data.policy as PolicyPage;
}

export async function updatePolicyPage(policyKey: PolicyPage["key"], payload: Omit<PolicyPage, "key">) {
  const { data } = await api.put(`/policies/${policyKey}`, payload);
  return data.policy as PolicyPage;
}
