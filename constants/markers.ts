// Teinte d'un sceau selon la note — une seule famille rose, trois intensités.
// 10–7 : rose vif · 6–4 : rose doux · 3–1 : rose profond.
// Palette fixe (indépendante du thème clair/sombre) : les marqueurs vivent sur la carte.
export const noteHue = (n: number): string =>
  n >= 7 ? '#ff2d87' : n >= 4 ? '#ff6aa8' : '#c71f6a';
