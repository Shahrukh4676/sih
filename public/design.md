---
version: "alpha"
name: "Studio — Spatial Interfaces"
description: "Studio Spatial Hero Section is designed for introducing a product with clear above-the-fold messaging. Key features include headline hierarchy, supporting copy, and a primary call-to-action. It is suitable for homepage hero areas and campaign landing pages."
colors:
  primary: "#111827"
  secondary: "#2640D9"
  tertiary: "#8A66E6"
  neutral: "#FFFFFF"
  background: "#FAFAFA"
  surface: "#111827"
  text-primary: "#111827"
  text-secondary: "#8A66E6"
  border: "#E5E7EB"
  accent: "#111827"
typography:
  display-lg:
    fontFamily: "System Font"
    fontSize: "72px"
    fontWeight: 600
    lineHeight: "72px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "System Font"
    fontSize: "16px"
    fontWeight: 200
    lineHeight: "24px"
  label-md:
    fontFamily: "System Font"
    fontSize: "14px"
    fontWeight: 300
    lineHeight: "20px"
rounded:
  md: "0px"
  full: "9999px"
spacing:
  base: "4px"
  sm: "2px"
  md: "4px"
  lg: "8px"
  xl: "10px"
  gap: "8px"
  card-padding: "24px"
  section-padding: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "12px"
  button-link:
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "0px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Full Bleed
  - Framing: Glassy
  - Grid: Strong

## Colors

The color system uses light mode with #111827 as the main accent and #FFFFFF as the neutral foundation.

- **Primary (#111827):** Main accent and emphasis color.
- **Secondary (#2640D9):** Supporting accent for secondary emphasis.
- **Tertiary (#8A66E6):** Reserved accent for supporting contrast moments.
- **Neutral (#FFFFFF):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #FAFAFA; Surface: #111827; Text Primary: #111827; Text Secondary: #8A66E6; Border: #E5E7EB; Accent: #111827

- **Gradients:** bg-gradient-to-r from-[#6633E6]/30 to-[#4059F0]/30, bg-gradient-to-br from-gray-300 to-gray-400 via-gray-200, bg-gradient-to-b from-transparent to-transparent via-gray-900/40

## Typography

Typography relies on System Font across display, body, and utility text.

- **Display (`display-lg`):** System Font, 72px, weight 600, line-height 72px, letter-spacing -0.025em.
- **Body (`body-md`):** System Font, 16px, weight 200, line-height 24px.
- **Labels (`label-md`):** System Font, 14px, weight 300, line-height 20px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, full bleed structural frame before changing ornament or component styling. Use 4px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Full Bleed
- **Base unit:** 4px
- **Scale:** 2px, 4px, 8px, 10px, 12px, 16px, 24px, 32px
- **Section padding:** 24px, 32px
- **Card padding:** 24px
- **Gaps:** 8px, 12px, 16px, 32px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 0.8px #E5E7EB; 0.8px #111827
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(38, 64, 217) 0px 0px 10px 0px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 0px 20px 0px
- **Blur:** 12px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 0px padding and a 0px radius. Drive the shell with repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.8) 0px, rgba(0, 0, 0, 0.8) 1px, rgba(0, 0, 0, 0) 1px, rgba(0, 0, 0, 0) 48px) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 9999px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles.

### Buttons
- **Primary:** background #111827, text #FFFFFF, radius 9999px, padding 12px, border 0px solid rgb(229, 231, 235).
- **Links:** text #111827, radius 0px, padding 0px, border 0px solid rgb(229, 231, 235).

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 4px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected moderate motion intensity without a deliberate reason.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 300ms and 150ms. Easing favors ease and cubic-bezier(0.4. Hover behavior focuses on text and transform changes. Scroll choreography uses GSAP ScrollTrigger for section reveals and pacing.

**Motion Level:** moderate

**Durations:** 300ms, 150ms

**Easings:** ease, cubic-bezier(0.4, 0, 0.2, 1)

**Hover Patterns:** text, transform, color

**Scroll Patterns:** gsap-scrolltrigger

## WebGL

Reconstruct the graphics as a full-bleed background field using webgl, renderer, alpha, dpr clamp, custom shaders. The effect should read as retro-futurist, technical, and meditative: dot-matrix particle field with green on black and sparse spacing. Build it from dot particles + soft depth fade so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** ThreeJS, WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field
  - **Effect:**
    - **Value:** Dot-matrix particle field
  - **Primitives:**
    - **Value:** Dot particles + soft depth fade
  - **Motion:**
    - **Value:** Slow breathing pulse
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** WebGL, Renderer, alpha, DPR clamp, custom shaders

**Techniques:** Dot matrix, Breathing pulse, Pointer parallax, Shader gradients, Noise fields

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <!-- WebGL Canvas Container -->
      <canvas id="webgl-canvas" class="fixed inset-0 w-full h-full pointer-events-none z-[-30]"></canvas>

      <!-- Technical Grid Overlay -->
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      // --- WebGL Architecture ---
      const initWebGL = () => {
          const canvas = document.getElementById('webgl-canvas');
          if (!canvas) return;

          const renderer = new THREE.WebGLRenderer({ 
              canvas, 
              alpha: true,
      …
      ```
  - **Renderer setup:**
    - **Language:** js
    - **Snippet:**
      ```
      const initWebGL = () => {
          const canvas = document.getElementById('webgl-canvas');
          if (!canvas) return;

          const renderer = new THREE.WebGLRenderer({ 
              canvas, 
              alpha: true, 
              antialias: false
      …
      ```

## ThreeJS

Reconstruct the Three.js layer as a full-bleed background field with layered spatial depth that feels retro-futurist and technical. Use alpha, dpr clamp renderer settings, perspective, ~45deg fov, sphere + plane geometry, shadermaterial materials, and ambient + key + rim lighting. Motion should read as timeline-led reveals, with poster frame + dom fallback.

**Id:** threejs

**Label:** ThreeJS

**Stack:** ThreeJS, WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field with layered spatial depth
  - **Render:**
    - **Value:** alpha, DPR clamp
  - **Camera:**
    - **Value:** Perspective, ~45deg FOV
  - **Lighting:**
    - **Value:** ambient + key + rim
  - **Materials:**
    - **Value:** ShaderMaterial
  - **Geometry:**
    - **Value:** sphere + plane
  - **Motion:**
    - **Value:** Timeline-led reveals

**Techniques:** Shader materials, Timeline beats, alpha, DPR clamp, Poster frame + DOM fallback

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <!-- WebGL Canvas Container -->
      <canvas id="webgl-canvas" class="fixed inset-0 w-full h-full pointer-events-none z-[-30]"></canvas>

      <!-- Technical Grid Overlay -->
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      // --- WebGL Architecture ---
      const initWebGL = () => {
          const canvas = document.getElementById('webgl-canvas');
          if (!canvas) return;

          const renderer = new THREE.WebGLRenderer({ 
              canvas, 
              alpha: true,
      …
      ```
  - **Renderer setup:**
    - **Language:** js
    - **Snippet:**
      ```
      const initWebGL = () => {
          const canvas = document.getElementById('webgl-canvas');
          if (!canvas) return;

          const renderer = new THREE.WebGLRenderer({ 
              canvas, 
              alpha: true, 
              antialias: false
      …
      ```
