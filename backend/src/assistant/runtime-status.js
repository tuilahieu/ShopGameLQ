let providerHealth = "unknown";

export function markAssistantProviderOnline() {
  providerHealth = "online";
}

export function markAssistantProviderOffline() {
  providerHealth = "offline";
}

export function getAssistantRuntimeStatus(configured) {
  if (!configured) {
    providerHealth = "unknown";
    return "fallback";
  }
  return providerHealth === "offline" ? "offline" : "online";
}

export function observeAssistantProvider(provider) {
  if (!provider) return null;
  return {
    async generate(input) {
      try {
        const result = await provider.generate(input);
        markAssistantProviderOnline();
        return result;
      } catch (error) {
        markAssistantProviderOffline();
        throw error;
      }
    },
  };
}
