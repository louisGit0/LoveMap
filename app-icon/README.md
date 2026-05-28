# LoveMap — App Icon

Pin cœur lumineux sur carte sombre éditoriale. Gradient magenta clair → violet, halo glow doux, sur un fond magenta-encre profond.

## Contenu du dossier

| Fichier                                | Format        | Usage                                    |
|----------------------------------------|---------------|------------------------------------------|
| `lovemap-icon-1024.svg`                | SVG vectoriel | Source. Régénère n'importe quelle taille |
| `lovemap-icon-1024.png`                | 1024×1024     | App Store / source raster                |
| `lovemap-icon-60-3x.png`               | 180×180       | iPhone @3x                               |
| `lovemap-icon-60-2x.png`               | 120×120       | iPhone @2x / Spotlight @3x               |
| `lovemap-icon-83.5-2x.png`             | 167×167       | iPad Pro @2x                             |
| `lovemap-icon-76-2x.png`               | 152×152       | iPad @2x                                 |
| `lovemap-icon-76.png`                  | 76×76         | iPad @1x                                 |
| `lovemap-icon-40-2x.png`               | 80×80         | Spotlight @2x                            |
| `lovemap-icon-29-3x.png`               | 87×87         | Settings @3x                             |
| `lovemap-icon-29-2x.png`               | 58×58         | Settings @2x                             |
| `lovemap-icon-29.png`                  | 29×29         | Settings @1x (iPad)                      |
| `lovemap-icon-20-3x.png`               | 60×60         | Notification @3x                         |
| `lovemap-icon-20-2x.png`               | 40×40         | Notification @2x                         |
| `lovemap-icon-20.png`                  | 20×20         | Notification @1x (iPad)                  |
| `Contents.json`                        | JSON          | Manifeste Xcode `AppIcon.appiconset`     |

Note : les noms de fichiers utilisent `-2x` / `-3x` au lieu de `@2x` / `@3x` à cause d'une contrainte de l'environnement. Le `Contents.json` référence les bons fichiers — aucune action requise.

## Installation

### Xcode (Swift / SwiftUI / Objective-C)

1. Dans le navigateur Xcode, ouvre `Assets.xcassets`
2. Sélectionne `AppIcon` (ou crée-le : New → AppIcon)
3. Clic droit → **Show in Finder**
4. Remplace le contenu du dossier `AppIcon.appiconset` par tout ce qu'il y a dans `app-icon/` (les 13 PNG + `Contents.json`)
5. Recompile

### React Native (CLI)

- Place `lovemap-icon-1024.png` à la racine du projet sous `assets/icon.png`
- Utilise `react-native-make` ou un outil similaire : `npx react-native-make set-icon --platform ios --icon ./assets/icon.png`

### Expo

- Place `lovemap-icon-1024.png` dans `assets/icon.png`
- Dans `app.json` / `app.config.js` :
  ```json
  {
    "expo": {
      "icon": "./assets/icon.png",
      "ios": {
        "icon": "./assets/icon.png"
      }
    }
  }
  ```
- Run `npx expo prebuild` puis rebuild

## Source vectorielle

`lovemap-icon-1024.svg` est l'original — édite-le pour modifier le logo ou régénérer les rasters à d'autres tailles :

```bash
# avec rsvg-convert
rsvg-convert -w 1024 -h 1024 lovemap-icon-1024.svg -o lovemap-icon-1024.png

# avec ImageMagick
magick -background none -density 1200 lovemap-icon-1024.svg -resize 1024x1024 lovemap-icon-1024.png
```
