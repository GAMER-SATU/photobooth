# Duet Photobooth for iOS

A native iOS implementation in **Swift** and **SwiftUI** replicating the full tactile, photochemical photobooth experience of the web application.

---

## 📸 Architecture & Feature Matrix

| Web Feature | iOS Implementation | Technical Detail |
| :--- | :--- | :--- |
| **Act I: Velvet Curtains & Admission** | `ActCurtainsView.swift` | Velvet drapery shaders, animated floating dust motes, "ADMIT ONE" (Solo) & "ADMIT TWO" (Duet) admission tickets with scissor snip audio and tear physics. |
| **Act II: Photobooth Machine Bay** | `ActBoothView.swift` | AVFoundation live camera feed (Solo 16:10 centered or Duet split-bay), 6 photochemical tone filters (Original, Warm, Vintage, Grain, Mono, Noir via CoreImage `CIFilter`), 3-shot film spool counter, synchronized 3-2-1 countdown, and double flash. |
| **Bench: Captions & Stickers** | `PolaroidCardView.swift` | Polaroid drop animation with thunk sound, inline 45-character memory caption writer, and interactive draggable/rotatable stickers (`heart`, `star`, `note`, `arrow`, `tape`, `xoxo`). |
| **Act III: Model Nº 2 Mechanical Printer** | `ActPrinterView.swift` | Metal chassis with screw rivets, illuminated amber indicator bulb, mechanical slot aperture, stepper motor vibration & ticking audio, progressive paper feed with micro-jitter, and photochemical developing transition where chemical milky emulsion dissolves into crisp color. |
| **Act IV: Memory Desk & Export** | `ActMemoryView.swift` | Dark desk surface, spring paper drop, red ink postmark stamp, physical **AirPrint** printing (`UIPrintInteractionController`), **Save to Photos** (`PHPhotoLibrary`), and native iOS **Share Sheet**. |

---

## 📁 Directory Structure

```
ios/
├── DuetPhotobooth.xcodeproj/
│   └── project.pbxproj            # Complete Xcode project configuration
├── DuetPhotobooth/
│   ├── DuetPhotoboothApp.swift    # @main App entry point
│   ├── Info.plist                 # Camera & Photo Library permissions
│   ├── Assets.xcassets/           # App icon & accent color sets
│   ├── Theme/
│   │   └── DuetTheme.swift        # Color tokens & typography
│   ├── Models/
│   │   ├── SessionMode.swift      # Solo vs Duet modes & Act definitions
│   │   ├── FilterModel.swift      # CIFilter photographic tone pipelines
│   │   ├── PhotoModel.swift       # Photo data model & capture frames
│   │   └── StickerModel.swift     # Draggable stickers & vector graphics
│   ├── Services/
│   │   ├── CameraManager.swift    # AVFoundation capture session & mirroring
│   │   ├── SoundEngine.swift      # AudioToolbox synthesizer & haptics
│   │   ├── StripRenderer.swift    # High-resolution 300 DPI strip generator
│   │   └── PrintManager.swift     # AirPrint & Photos Album integration
│   ├── ViewModels/
│   │   └── PhotoboothViewModel.swift # State manager coordinating acts I-IV
│   └── Views/
│       ├── ContentView.swift      # Root act navigation router
│       ├── ActCurtainsView.swift  # Act I: Velvet curtains & tickets
│       ├── ActBoothView.swift     # Act II: Machine bay & bench
│       ├── ActPrinterView.swift   # Act III: Mechanical printer & developing
│       ├── ActMemoryView.swift    # Act IV: Memory desk & export
│       └── Components/
│           ├── HeaderView.swift       # Room code badge & sound toggle
│           ├── LightboxView.swift     # "PHOTOS" marquee & film counter
│           ├── PhotoStripView.swift   # Photobooth strip with emulsion layer
│           └── PolaroidCardView.swift # Polaroid card, captions & stickers
└── README.md
```

---

## 🚀 How to Run in Xcode

1. Open `ios/DuetPhotobooth.xcodeproj` in **Xcode 15+** on macOS:
   ```bash
   open ios/DuetPhotobooth.xcodeproj
   ```
2. Select an iOS Simulator (e.g., **iPhone 15 Pro**) or connect a physical iPhone via USB/WiFi.
3. Press **Cmd + R** (or click the Run button).
4. If running on a physical device, grant Camera and Photo Library permissions when prompted. When running on the Simulator, a built-in mock camera feed is automatically provided!
