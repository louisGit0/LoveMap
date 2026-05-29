import * as Haptics from 'expo-haptics';

// Helper haptique centralisé (FOND-03 / IOS-03).
// API par intention, fire-and-forget : on n'attend jamais la promesse (D-03).
// L'OS coupe déjà les haptiques si l'utilisateur les a désactivés — pas de try/catch.
export const haptics = {
  // Changement de sélection (D-01)
  select: () => {
    Haptics.selectionAsync();
  },
  // Tap courant / navigation — impact light (D-01)
  tap: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  // Action importante (ouverture sheet, toggle) — impact medium (D-02)
  press: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  // Résultat positif (sceller, accepter) — notification success (D-02)
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  // Alerte / acte irréversible (refus, suppression) — notification Warning (D-02)
  warn: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  // Erreur réseau — notification error (D-02, priorité moindre)
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
