# Chinese Companion

## Product Requirements Document (PRD)

Version: 1.0

---

# Project Overview

Chinese Companion is a desktop application designed to help users learn Chinese vocabulary through their own content.

Unlike traditional language-learning apps that teach generic vocabulary, Chinese Companion analyzes screenshots, chat logs, notes, articles, subtitles, PDFs, and other Chinese media to identify the vocabulary that will provide the greatest increase in reading comprehension.

The application combines:

* Duolingo-style gamification
* Anki-style spaced repetition
* Personal content ingestion
* Reading comprehension tracking
* Desktop companion widget aesthetics

The application should function fully offline for review and learning, while using Claude API when internet is available for intelligent vocabulary extraction and content analysis.

---

# Core Philosophy

The user does NOT want to learn random Chinese.

The user wants to learn the exact vocabulary required to understand:

* WeChat conversations
* Xiaohongshu posts
* Chinese social media
* News articles
* Chinese websites
* Drama subtitles
* Personal notes
* Imported PDFs

The system should prioritize words that maximize reading comprehension gains.

---

# Design Goals

The application should feel like:

* Duolingo
* Anki
* Steam Achievements
* A cute desktop pet

The application should NOT feel like:

* A school textbook
* A boring flashcard app
* Enterprise software

The experience should be cozy, rewarding, lightweight, and aesthetically pleasing.

---

# Target Platform

Primary:

* Windows 11

Secondary:

* macOS

Future:

* Linux

---

# Technology Stack

Frontend:

* React
* TypeScript
* TailwindCSS

Desktop Framework:

* Electron

Database:

* SQLite

State Management:

* Zustand

Charts:

* Recharts

Graph Visualization:

* React Flow

OCR:

* Tesseract OCR
* Chinese language packs

Animation:

* Framer Motion

Build System:

* Vite

Testing:

* Vitest
* Playwright

---

# Online vs Offline Architecture

## Online Mode

When internet is available:

Claude API is used for:

* OCR cleanup
* Word extraction
* Difficulty estimation
* Context sentence generation
* Definitions
* Learning recommendations
* Reading comprehension estimation

## Offline Mode

When internet is unavailable:

The application must still support:

* Flashcard review
* XP progression
* Streak tracking
* Achievement system
* Statistics
* Dashboard
* Knowledge graph
* Existing vocabulary

No internet should be required for studying.

---

# User Workflow

## Step 1

User imports content.

Examples:

* Screenshot
* PDF
* TXT file
* Notes
* Subtitles
* Chat exports

## Step 2

System extracts text.

## Step 3

Claude analyzes content.

Outputs:

* Vocabulary list
* Definitions
* Frequency scores
* Recommended learning order

## Step 4

System generates flashcards.

## Step 5

User studies through companion widget.

## Step 6

XP and progress increase.

## Step 7

Reading comprehension improves.

---

# Floating Companion Widget

This is the heart of the application.

The widget should resemble a floating desktop media player.

Reference style:

* Soft glassmorphism
* Rounded corners
* Minimalist
* Cozy
* Cute

The widget must remain visible while studying or browsing.

---

## Widget Dimensions

Collapsed:

280 x 420 px

Expanded:

600 x 800 px

Resizable.

Draggable.

Always-on-top optional.

---

# Visual Design System

## Theme

Soft Blue Winter Aesthetic

Inspired by:

* macOS widgets
* Animal Crossing
* Study-with-me streams
* Cozy productivity tools

---

## Color Palette

Primary Blue:

#A9D6FF

Secondary Blue:

#D7EEFF

Background:

#FFFFFF

Surface:

#F8FBFF

Cloud Gray:

#EEF4FA

Silver Blue:

#D4E1EE

XP Gold:

#FFD866

Success Mint:

#95F0C0

Error Pink:

#FFB6C1

---

## UI Rules

Everything should be:

* Rounded
* Soft
* Airy
* Calm

Avoid:

* Neon colors
* Cyberpunk themes
* Harsh shadows
* Sharp corners

---

# Main Screens

## Companion Widget

Displays:

Current word

Example:

Chinese:

熟悉

Pinyin:

shúxī

Meaning:

familiar with

Buttons:

* Know
* Review
* Difficult

Footer:

* XP
* Streak
* Daily goal

---

## Review Mode

Full flashcard experience.

Supports:

* Multiple choice
* Cloze deletion
* Meaning recall
* Reading comprehension

---

## Vocabulary Library

Displays:

* All learned words
* Difficulty
* Frequency
* Mastery level

Filters:

* Learned
* Reviewing
* Mastered
* Difficult

---

## Import Center

Supports:

Images:

* PNG
* JPG
* WEBP

Documents:

* TXT
* PDF
* DOCX

Subtitle files:

* SRT

---

## Statistics Dashboard

Displays:

Known words

Daily XP

Weekly XP

Streak

Review success rate

Study time

Reading readiness score

---

## Knowledge Graph

Visual relationship map.

Examples:

认识

* 认识到
* 认识论
* 认识错误

Hovering nodes displays:

* Meaning
* Mastery
* Frequency

---

# Reading Readiness System

One of the core features.

For every imported document:

Calculate:

Known Words %

Unknown Words %

Estimated Reading Difficulty

Estimated Time To Learn

Example:

Document Readiness

Comprehension:
82%

Unknown Words:
17

Study Time:
34 min

Recommendation:
Learn 12 words first

---

# Vocabulary Selection Algorithm

The application should NOT teach every word.

Score every word.

Formula:

Importance Score

=

Frequency

×

Occurrence In User Content

×

Comprehension Gain

×

Difficulty Weight

Words that provide the highest comprehension gains should be prioritized.

---

# Flashcard System

## Card Type 1

Chinese → English

Example:

终于

?

---

## Card Type 2

English → Chinese

Example:

Eventually

?

---

## Card Type 3

Sentence Cloze

Example:

今天我___弄明白了

---

## Card Type 4

Reading Comprehension

Short paragraph

Question

Meaning interpretation

---

# Spaced Repetition

Implement FSRS.

Requirements:

* Modern scheduling
* Adaptive intervals
* Retention tracking

Card States:

* New
* Learning
* Review
* Mastered

---

# Gamification System

## XP

Correct Review:

+10 XP

Hard Card:

+20 XP

Daily Goal:

+50 XP

Perfect Session:

+100 XP

---

## Levels

Level 1:
Beginner Reader

Level 10:
Casual Reader

Level 25:
Web Reader

Level 50:
Novel Reader

Level 100:
Character Sage

---

## Achievements

First Word

Learn 10 Words

Learn 100 Words

Learn 1000 Words

Import First Screenshot

7-Day Streak

30-Day Streak

100-Day Streak

Master 500 Words

Read First Article

Read First Novel Chapter

Steam-style popup notifications.

---

# Database Schema

Users

Words

Cards

Reviews

Achievements

XP_Log

Imported_Content

Documents

Knowledge_Graph

Settings

Statistics

---

# OCR Pipeline

Input:

Image

↓

Tesseract OCR

↓

Chinese Cleanup

↓

Claude Analysis

↓

Vocabulary Extraction

↓

Flashcard Generation

---

# Claude Integration

Create dedicated AI service layer.

Functions:

extractVocabulary()

estimateDifficulty()

generateDefinitions()

generateContextSentences()

calculateReadingReadiness()

recommendNextWords()

Fallback:

If Claude unavailable:

Queue task until online.

---

# Settings

Theme

Widget Transparency

Widget Size

Always On Top

Review Frequency

Daily XP Goal

Claude API Key

Offline Mode

---

# MVP Requirements

Must Have:

* Widget
* Flashcards
* OCR
* SQLite
* XP
* Levels
* Achievements
* Import Screenshots
* Claude Integration
* Reading Readiness

Nice To Have:

* Knowledge Graph
* Animated Companion
* Cloud Sync

Future:

* Mobile App
* Browser Extension
* WeChat Integration
* Xiaohongshu Integration

---

# Folder Structure

chinese-companion/

electron/

src/

components/

widgets/

pages/

flashcards/

dashboard/

statistics/

knowledge_graph/

achievements/

import_pipeline/

ocr/

database/

services/

claude/

hooks/

stores/

utils/

assets/

sqlite/

tests/

docs/

package.json

---

# Success Metrics

Within 30 days of use:

User should:

* Learn 500+ words
* Increase reading comprehension by 20%
* Maintain streaks
* Prefer studying through the widget over traditional flashcards

The application's primary objective is maximizing Chinese reading comprehension using the user's personal content while maintaining a highly engaging and aesthetically pleasing desktop companion experience.
