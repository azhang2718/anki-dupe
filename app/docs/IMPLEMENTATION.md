# IMPLEMENTATION_PLAN.md

# Chinese Companion Implementation Plan

## IMPORTANT INSTRUCTIONS FOR CLAUDE CODE

You are a senior software engineer building a production-quality desktop application.

DO NOT attempt to generate the entire application in one step.

Build the application incrementally in phases.

At the end of every phase:

1. Ensure code compiles.
2. Ensure tests pass.
3. Ensure application remains runnable.
4. Commit code before moving forward.

The final application must be maintainable, scalable, and production-ready.

---

# Development Philosophy

Priorities:

1. Stability
2. Simplicity
3. Extensibility
4. Aesthetics
5. Performance

Do not over-engineer.

Use clean architecture.

Use TypeScript strict mode.

---

# Phase 0 — Project Initialization

## Goal

Create a clean foundation.

## Tasks

Initialize:

* Electron
* React
* TypeScript
* Vite
* TailwindCSS

Configure:

* ESLint
* Prettier
* Vitest
* Playwright

Create folder structure.

Implement:

* Routing
* State management
* Theme system

## Deliverables

Application launches successfully.

Placeholder screens exist.

No functionality required yet.

---

# Phase 1 — Database Layer

## Goal

Create persistent storage.

## Technology

SQLite

## Tables

users

words

cards

reviews

achievements

xp_log

documents

imported_content

statistics

settings

## Requirements

Repository pattern.

Database abstraction layer.

Migration support.

Seed support.

## Deliverables

Database initializes automatically.

CRUD operations tested.

Unit tests included.

---

# Phase 2 — Design System

## Goal

Build reusable UI foundation.

## Components

Button

Card

Modal

ProgressBar

AchievementToast

WidgetContainer

GlassPanel

StatCard

NavigationBar

## Theme

Soft blue aesthetic.

Glassmorphism.

Rounded corners.

Responsive layout.

## Deliverables

Storybook-style component showcase page.

All reusable UI components complete.

---

# Phase 3 — Core Flashcard Engine

## Goal

Implement learning system.

## Features

Card creation

Card review

Review history

Mastery tracking

Difficulty tracking

## Card Types

Chinese → English

English → Chinese

Cloze

Reading Comprehension

## Deliverables

Users can complete review sessions.

Progress persists.

---

# Phase 4 — FSRS Spaced Repetition

## Goal

Implement scheduling system.

## Requirements

FSRS algorithm.

Card states:

* New
* Learning
* Review
* Mastered

Track:

* Retention
* Forgetting curve
* Review intervals

## Deliverables

Reviews automatically scheduled.

Intervals update correctly.

---

# Phase 5 — Floating Companion Widget

## Goal

Build signature feature.

## Requirements

Desktop widget.

Draggable.

Resizable.

Always-on-top toggle.

Displays:

* Current card
* XP
* Streak
* Daily goal

Collapsed mode.

Expanded mode.

## Deliverables

Fully functional floating widget.

Works independently from main window.

---

# Phase 6 — Gamification System

## Goal

Make studying addictive.

## Features

XP

Levels

Achievements

Streaks

Progress bars

Unlock animations

## Example Achievements

First Word

10 Words Learned

100 Words Learned

7-Day Streak

30-Day Streak

Import First Screenshot

## Deliverables

Achievement notifications.

XP progression system.

Persistent streak tracking.

---

# Phase 7 — Statistics Dashboard

## Goal

Provide motivation through analytics.

## Metrics

Words learned

Words mastered

Study time

Review accuracy

Retention rate

XP history

Streak history

## Charts

Daily XP

Weekly XP

Mastery distribution

Learning velocity

## Deliverables

Interactive dashboard.

All charts functional.

---

# Phase 8 — Import Pipeline

## Goal

Import user content.

## Supported Inputs

PNG

JPG

WEBP

PDF

TXT

DOCX

SRT

## Pipeline

Import

↓

Extract text

↓

Store document

↓

Generate processing task

## Deliverables

Documents import successfully.

Content stored locally.

---

# Phase 9 — OCR System

## Goal

Extract Chinese text from images.

## Technology

Tesseract OCR

Chinese language support.

## Requirements

Batch processing.

Confidence scores.

OCR correction layer.

## Deliverables

Screenshots convert into text.

Text stored in database.

---

# Phase 10 — Claude Integration

## Goal

Add intelligence.

## Claude Responsibilities

Vocabulary extraction

Word frequency analysis

Definition generation

Context sentence generation

Reading difficulty estimation

Reading readiness estimation

Learning recommendations

## Architecture

Dedicated AI service layer.

Never call Claude directly from UI.

Use queue-based processing.

## Deliverables

Imported content produces vocabulary recommendations.

---

# Phase 11 — Vocabulary Intelligence

## Goal

Determine what should be learned.

## Algorithm

Importance Score =

Frequency

×

User Content Frequency

×

Comprehension Gain

×

Difficulty Weight

## Outputs

Recommended words.

Recommended review order.

Recommended study path.

## Deliverables

Vocabulary prioritized intelligently.

---

# Phase 12 — Reading Readiness System

## Goal

Measure comprehension.

## Outputs

Known words %

Unknown words %

Difficulty score

Estimated study time

Readiness score

## Example

Comprehension:
82%

Unknown Words:
17

Recommended Study:
12 words

## Deliverables

Every imported document receives readiness score.

---

# Phase 13 — Knowledge Graph

## Goal

Visualize relationships.

## Technology

React Flow

## Features

Word families.

Compound words.

Related vocabulary.

Mastery coloring.

## Deliverables

Interactive graph view.

---

# Phase 14 — Polish Pass

## Goal

Create premium experience.

## Tasks

Animations.

Microinteractions.

Smooth transitions.

Performance optimization.

Loading states.

Error handling.

Accessibility improvements.

## Deliverables

Production-quality UX.

---

# Phase 15 — Offline Mode

## Goal

Ensure application remains useful without internet.

## Requirements

Reviews work.

FSRS works.

XP works.

Statistics work.

Dashboard works.

Widget works.

## Disabled Features

Claude processing only.

Queue requests until online.

## Deliverables

Fully usable offline learning experience.

---

# Phase 16 — Production Hardening

## Goal

Prepare for release.

## Tasks

Error boundaries.

Crash recovery.

Logging.

Data backup.

Import/export.

Settings migration.

Performance testing.

Memory profiling.

## Deliverables

Stable release candidate.

---

# Future Features (Do Not Build Yet)

Cloud sync

Mobile app

Browser extension

WeChat integration

Xiaohongshu integration

Multi-language support

Collaborative decks

Community decks

Speech recognition

Pronunciation training

---

# Success Criteria

The application is successful when:

1. User can import Chinese screenshots.
2. OCR extracts text correctly.
3. Claude identifies useful vocabulary.
4. Flashcards are generated automatically.
5. User studies through floating widget.
6. XP and achievements encourage continued use.
7. Offline review works perfectly.
8. Reading comprehension steadily improves.

Always prioritize reading comprehension gains over vocabulary quantity.

The purpose of the application is helping the user understand real Chinese content, not memorizing random words.
