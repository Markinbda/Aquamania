const requiredConsentTypes = ["WATER_SAFETY", "PHOTO_CONSENT", "MEDICAL_CONSENT", "GENERAL"] as const;

export type ConsentType = (typeof requiredConsentTypes)[number];

export function hasAllRequiredConsents(formTypes: string[]) {
  const unique = new Set(formTypes);
  return requiredConsentTypes.every((required) => unique.has(required));
}

export function buildSignedConsentRecords(signedByName: string, ipAddress: string | null, formTypes: string[]) {
  const now = new Date();
  return formTypes.map((formType) => ({
    formType,
    signedAt: now,
    signedByName,
    ipAddress,
    version: "1.0"
  }));
}

export function getRequiredConsentTypes() {
  return [...requiredConsentTypes];
}
