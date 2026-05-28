# Prompt pour Claude Code — Installation du logo LoveMap

Copie-colle ce prompt dans Claude Code, dans le dossier racine de ton projet iOS / React Native / Expo. Le dossier `app-icon/` doit être à la racine (ou au chemin que tu indiqueras).

---

## Prompt

> Je viens d'ajouter un dossier `app-icon/` à la racine du projet contenant le nouveau logo de l'app **LoveMap** : un cœur lumineux en gradient magenta → violet posé sur une carte sombre. Le master est `app-icon/lovemap-icon-1024.png` (1024×1024). Le dossier contient aussi toutes les tailles iOS requises et un `Contents.json` pré-rempli, plus la source vectorielle `lovemap-icon-1024.svg`.
>
> **Détecte la stack du projet** (iOS natif Xcode, React Native CLI, Expo, Flutter, autre) puis installe ce logo comme app icon en suivant la procédure adaptée. **Conserve** le fichier `Contents.json` pré-rempli quand la stack utilise un `AppIcon.appiconset` — il référence déjà les bons fichiers avec les noms `lovemap-icon-XX-Yx.png`.
>
> **Procédure attendue selon la stack :**
>
> - **Xcode (Swift / SwiftUI / Objective-C)** : trouve `Assets.xcassets`, remplace tout le contenu de `AppIcon.appiconset/` par le contenu du dossier `app-icon/` (les 13 PNG + `Contents.json`). Vérifie que le `AppIcon.appiconset` est bien référencé dans le build (`General → App Icons and Launch Images` ou `Build Settings → ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon`).
>
> - **React Native CLI** : utilise `npx react-native-make set-icon --platform ios --icon ./app-icon/lovemap-icon-1024.png` si la lib est installée. Sinon, copie manuellement les fichiers dans `ios/<AppName>/Images.xcassets/AppIcon.appiconset/`.
>
> - **Expo (managed)** : copie `lovemap-icon-1024.png` vers `assets/icon.png` (écrase l'existant), puis vérifie/édite `app.json` ou `app.config.js` pour pointer `expo.icon` et `expo.ios.icon` vers ce fichier. Lance `npx expo prebuild --clean` si le projet est en EAS / bare workflow.
>
> - **Flutter** : utilise `flutter_launcher_icons`. Ajoute la dépendance, configure `pubspec.yaml` avec `flutter_icons.image_path: "app-icon/lovemap-icon-1024.png"`, puis lance `flutter pub run flutter_launcher_icons:main`.
>
> - **Autre framework** : adapte intelligemment en utilisant le PNG 1024 comme source.
>
> **Après installation :**
> 1. Confirme quels fichiers ont été modifiés ou créés.
> 2. Indique comment vérifier visuellement le résultat (build & run, ou simulateur).
> 3. Si nécessaire, ajoute `app-icon/lovemap-icon-1024.png` au tracking git (`git add app-icon/`).
>
> **Ne touche pas** au reste de l'app — uniquement l'icône.

---

## Notes pour toi (utilisateur)

- Le fichier **master** est `lovemap-icon-1024.png`. Tu peux toujours le réutiliser pour régénérer les autres tailles avec n'importe quel outil (ImageMagick, online tools comme appicon.co, etc.).
- La **source vectorielle** est `lovemap-icon-1024.svg` — édite-la dans Figma/Illustrator/Inkscape si tu veux retoucher le logo plus tard.
- Les noms de fichiers utilisent `-2x` / `-3x` au lieu de `@2x` / `@3x` (contrainte d'export). Le `Contents.json` référence les bons fichiers, donc Xcode ne s'en aperçoit pas.
- Si Claude Code détecte une stack que je n'ai pas anticipée, il s'adaptera tout seul à partir du master 1024.
