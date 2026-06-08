# UI_DESIGN_SYSTEM.md

# Chinese Companion Design System

Version 1.0

---

# Design Philosophy

Chinese Companion should feel like:

* A cozy study companion
* A desktop pet
* A premium macOS widget
* A study-with-me livestream

The application should NEVER feel like:

* Enterprise software
* A business dashboard
* A spreadsheet
* A school learning portal
* Traditional flashcard software

The user should enjoy simply having the application open.

The application should feel calm, beautiful, lightweight, and rewarding.

---

# Core Aesthetic

Keywords:

* Cozy
* Airy
* Soft
* Minimal
* Cute
* Elegant
* Premium

Visual References:

* Apple widgets
* Arc Browser
* Notion Calendar
* Animal Crossing UI
* LoFi study aesthetics
* Cozy desktop setups

---

# Visual Hierarchy

Priority:

1. Vocabulary
2. Progress
3. Motivation
4. Statistics

Never overwhelm users with numbers.

The application should feel emotional first and analytical second.

---

# Color System

## Primary Palette

Ice Blue

#A9D6FF

Sky Blue

#D7EEFF

Cloud White

#FFFFFF

---

## Surface Colors

Surface Light

#F8FBFF

Surface Medium

#EEF4FA

Surface Dark

#DDEAF5

---

## Accent Colors

XP Gold

#FFD866

Success Mint

#95F0C0

Achievement Gold

#FFC857

Focus Blue

#7CB9FF

---

## Feedback Colors

Success

#95F0C0

Warning

#FFD866

Error

#FFB6C1

---

# Typography

## Font Family

Primary:

Inter

Fallback:

SF Pro Display

System UI

---

## Chinese Font

Noto Sans SC

Fallback:

PingFang SC

Microsoft YaHei

---

# Typography Scale

Hero

40px

Weight 700

---

Section Title

24px

Weight 600

---

Card Title

18px

Weight 600

---

Body

14px

Weight 400

---

Caption

12px

Weight 400

---

# Spacing System

Base Unit

8px

Allowed spacing:

8

16

24

32

48

64

Never use arbitrary spacing values.

---

# Border Radius

Small

12px

Medium

20px

Large

28px

Widget

32px

Everything should be rounded.

Avoid sharp corners entirely.

---

# Shadow System

Soft Shadow

0 4px 20px rgba(0,0,0,0.05)

---

Floating Shadow

0 12px 40px rgba(0,0,0,0.08)

---

Modal Shadow

0 20px 60px rgba(0,0,0,0.12)

---

Never use harsh shadows.

---

# Glassmorphism

Most major surfaces should use:

backdrop-filter: blur(20px);

background:
rgba(255,255,255,0.75);

border:
1px solid rgba(255,255,255,0.4);

The UI should appear translucent and airy.

---

# Main Widget Design

This is the signature feature.

Everything else should visually support it.

---

# Widget Dimensions

Collapsed

280 x 420

Expanded

600 x 800

---

# Widget Structure

Top

Greeting

Daily XP

Streak

Middle

Current Vocabulary Card

Bottom

Quick Actions

---

# Widget Example Layout

┌───────────────────────┐

Reading Companion

Level 12

🔥 27 Day Streak

───────────────────────

熟悉

shúxī

familiar with

───────────────────────

[Know]

[Review]

[Difficult]

───────────────────────

XP 1450 / 2000

└───────────────────────┘

---

# Card Design

Cards should resemble collectible game cards.

Soft gradients.

Subtle glow.

Large Chinese text.

Minimal clutter.

---

# Vocabulary Card Layout

Chinese Word

Largest element.

Centered.

32-40px.

---

Pinyin

Secondary.

Muted color.

---

Meaning

Clear.

Easy to read.

---

Example Sentence

Smaller.

Optional.

---

# Animation Philosophy

Animations should feel:

* Gentle
* Fluid
* Delightful

Never flashy.

Never distracting.

---

# Animation Duration

Fast

150ms

Medium

250ms

Slow

400ms

---

# Card Flip Animation

Use spring animation.

Physical feeling.

Smooth.

Not dramatic.

---

# Achievement Popup

Inspired by:

Steam achievements

PlayStation trophies

---

Appears:

Bottom right

Slides upward

Fades in

Displays:

Achievement Icon

Achievement Name

XP Reward

Automatically disappears.

---

# XP Visualization

XP should feel rewarding.

Use:

Animated progress bars.

Floating XP particles.

Small celebratory effects.

Never excessive.

---

# Dashboard Design

Dashboard should NOT resemble analytics software.

Use:

Large cards

Lots of whitespace

Friendly language

Illustrations

Progress circles

---

Bad:

Dense tables

Complex charts

Tiny text

---

Good:

"Your Reading Journey"

"Words Mastered"

"Current Streak"

"Reading Readiness"

---

# Reading Readiness Card

Large centerpiece.

Displays:

Comprehension %

Unknown Words

Recommended Study Time

Visualized as a circular progress indicator.

---

# Knowledge Graph Design

Dark lines.

Bright nodes.

Mastered words glow softly.

Unknown words appear faded.

Hovering node reveals:

Meaning

Mastery

Frequency

Examples

---

# Empty States

Every screen should have beautiful empty states.

Example:

"No words yet.

Import your first screenshot to begin your journey."

Include illustration.

---

# Loading States

Use skeleton loaders.

Soft shimmer effect.

Never use spinning wheels.

---

# Sound Design

Optional.

Toggleable.

Soft sounds only.

Examples:

Card correct

Achievement unlock

Level up

Daily goal complete

No harsh audio.

---

# Companion Character (Future)

Reserved feature.

Small mascot.

Optional.

Can sit on widget edge.

Provides encouragement.

Examples:

"3 more words until level up!"

"Great work today."

Must never become annoying.

---

# Emotional Design Principles

Every interaction should answer:

1. Am I progressing?
2. Am I improving?
3. Do I want to continue?

The application should create a feeling of:

"I'll learn just one more word."

which naturally becomes:

"I studied for 30 minutes."

---

# Critical Design Rules

Never use:

Sharp corners

Dark corporate themes

Dense tables

Technical language

Complex menus

Tiny buttons

Information overload

---

Always use:

Whitespace

Rounded corners

Glassmorphism

Soft colors

Positive feedback

Progress indicators

Large readable typography

Friendly language

Subtle delight

---

# Final Design Goal

When users see the application for the first time, they should think:

"This is adorable."

After a week they should think:

"This is helping me."

After a month they should think:

"I don't want to lose my streak."

That emotional progression is the primary UI objective.
