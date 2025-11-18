# Spaktok Feature Expansion UI Design Overview

This document captures proposed UI layouts, colors, and component placement for the new advanced features (Duet/Stitch, World AR, Captions Overlay, Screenshot Indicator) prior to backend wiring.

## Color & Theme
- Primary: `Color(0xFF5A31F4)` (vivid violet accent)
- Secondary: `Color(0xFF00D3A9)` (teal for action confirmations)
- Danger: `Color(0xFFFF4457)`
- Background (Dark Mode): `Color(0xFF101317)`
- Surface: `Color(0xFF1A1F24)`
- Elevated Surface: `Color(0xFF232A31)`
- Overlay Gradient (top): transparent -> `Color(0xAA101317)`

Typography (use existing theme fonts):
- Headline (Screen Title): 20–22px, semi-bold
- Section Label: 14px, medium
- Action Button: 13–14px, medium, uppercase optional

Elevation & Blur:
- Bottom interaction bars use 12dp elevation or a 20% blur layer (if performance acceptable).
- Floating capture buttons: 56px circular, shadow (blur radius 12, spread 1, opacity 0.3).

## 1. Duet / Stitch Creation Flow
### Screen: Create Duet
Layout (Portrait):
```
┌──────────────────────────────────────────┐
│ AppBar (Back, Title: "Create Duet", Help)│
├──────────────────────────────────────────┤
│ Original Video Preview (left 50%)        │
│ User Recording View (right 50%)          │
│ (Split by a thin divider, double-tap     │
│  to swap sides)                          │
├──────────────────────────────────────────┤
│ Effect Filters Horizontal List (scroll)  │
├──────────────────────────────────────────┤
│ Bottom Bar: [Flip Cam] [Countdown] [Record] [Mute] [Preview] │
└──────────────────────────────────────────┘
```
- Record button: prominent circular primary color, ripple when idle.
- Countdown/mute show badge states (e.g., muted icon with slash).

### Screen: Stitch Editor
```
┌──────────────────────────────────────────┐
│ AppBar (Back, Title: "Create Stitch")    │
├──────────────────────────────────────────┤
│ Timeline Scrubber (original video)       │
│ Clip Range Selector (drag handles)       │
│ Preview Combined Sequence                │
├──────────────────────────────────────────┤
│ Actions: [Select Range] [Add More Clip]  │
│          [Reorder Clips] [Preview]       │
├──────────────────────────────────────────┤
│ Bottom Primary: [Generate Stitch]        │
└──────────────────────────────────────────┘
```

## 2. World AR Screen
```
┌──────────────────────────────────────────┐
│ Top Overlay: Back  |  Session Status  |  Plane Toggle │
├──────────────────────────────────────────┤
│                AR View (Full)                          │
│  (Tap to place model, pinch scale, rotate gesture)     │
│                                                        │
│  Floating Button (Capture) centered bottom             │
├──────────────────────────────────────────┤
│ Bottom Sheet (Pull-up):                               │
│  Categories Tabs: [Decor] [Avatars] [Props] [Custom]   │
│  Horizontal Model Carousel (cards w/ 64px thumb)       │
│  Selected Model Info + [Place] [Remove All] buttons    │
└──────────────────────────────────────────┘
```

## 3. Captions Overlay
Position: bottom 15% of video player, centered, max width 80%.
Style:
- Rounded rectangle, background `Color(0xAA000000)`, 8px radius.
- Text white, drop-shadow for readability.
- Multi-line wraps, animate fade-in/out.

## 4. Screenshot Indicator
- Top-right toast style: icon (camera-flash), label "Screenshot captured".
- Critical content (private chat): red accent variant.
- Auto-dismiss after 4 seconds; manual close (X).

## Interaction Notes
- All primary actions accessible within thumb zone (lower half of screen).
- Avoid stacking >3 floating buttons; use a bottom toolbar when needed.
- Provide haptic feedback for recording start/stop, object placement.

## Accessibility
- Minimum tap target 44px.
- High contrast for caption text over video.
- Color not the sole indicator (icons + text labels).

## Pending Backend Wiring Points
- Duet/Stitch: integrate with `DuetStitchService` methods for generation & upload.
- World AR: connect `WorldARService.placeObject`, `uploadCustomModel` later.
- Captions: subscribe to Firestore caption updates and overlay via stream.
- Screenshot: call `ScreenshotDetectionService.initialize()` inside story/chat screens.

## Next Steps
1. Implement placeholder Flutter screens (no backend calls yet). 
2. Validate layout and adjust paddings & color choices.
3. Wire services and test flows incrementally.

---
This doc can be updated as UI feedback is gathered.
