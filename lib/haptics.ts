import * as Haptics from 'expo-haptics';

// Helper haptique centralisé (FOND-03 / IOS-03).
// API par intention, fire-and-forget : on n'attend jamais la promesse (D-03).
// Chaque appel est DÉFENSIF (try/catch synchrone + .catch sur la promesse) :
// un retour haptique indisponible — typiquement un iPad, qui n'a pas de Taptic
// Engine — ne doit JAMAIS faire échouer le onPress qui l'appelle. Cf. refus
// Apple 2.1a « button unresponsive » sur iPad (build 37) : haptics.tap()
// précédait handleLogin() et empêchait la connexion.
function safe(run: () => Promise<unknown>): void {
  try {
    run().catch(() => {});
  } catch {
    // module natif indisponible ou appel synchrone qui lève — on ignore
  }
}

export const haptics = {
  // Changement de sélection (D-01)
  select: () => safe(() => Haptics.selectionAsync()),
  // Tap courant / navigation — impact light (D-01)
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  // Action importante (ouverture sheet, toggle) — impact medium (D-02)
  press: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  // Résultat positif (sceller, accepter) — notification success (D-02)
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  // Alerte / acte irréversible (refus, suppression) — notification Warning (D-02)
  warn: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  // Erreur réseau — notification error (D-02, priorité moindre)
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
