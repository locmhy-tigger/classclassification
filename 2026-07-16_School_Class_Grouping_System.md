---
date: 2026-07-16
tags: [School-Admin, Python, React, Class-Grouping, Automation]
task_type: Concluded Practice
---

# Concluded Practice: School Class and Group Division Decision System

## Problem
Every academic year, the school IT admin/teachers need to divide S1-S6 students into classes and option groups. This process has several highly complex constraints:
1. **S1 (F.1) Placement**: Top 35 in Pre-Secondary HKAT score to 1A, remaining evenly distributed to 1B, 1C, 1D using a balanced gender-snake pattern. New students' houses (Red, Yellow, Blue, Green) must be assigned cyclically.
2. **S2 Placement**: Top 34 S1 students in annual Form Rank go to 2A, the rest distributed to 2B, 2C, 2D in strict cyclic rank order.
3. **S3 Placement**: Top 35 S2 students in annual Form Rank go to 3A, the rest stay in their previous class letter (B->B, C->C, D->D), and remaining 2A students are balanced.
4. **S4 Placement**: Option allocation. Top 33 students selecting X3 (M1/Bio) go to 4D. The rest of X3 (approx. 17) go to 4C. Remaining spots in 4C (target size 31) are filled by non-X3 students sorted by (Chinese + Life & Society) score. The rest are cyclically split between 4A and 4B.
5. **S5-S6 Placement**: Direct promotion class mapping (e.g. 4A->5A, 5A->6A).
6. **Student constraints**: Relational pairing constraints (SEN or discipline suggestions not to be in the same class).
7. **Excel Layout & Formulas**: Summary tables with COUNTIF formulas must be written at the bottom of S1-S6 sheets, and sheet "人數" must link S1-S6 totals.

## Solution
We built a local full-stack web application (`Vite + React` frontend, `Flask` python backend) served locally:
1. **Frontend (`React`)**: A beautiful, glassmorphic dark-mode web GUI that allows:
   - Selecting working directory (wildcard matches files to support future years).
   - Customizing division rules (rank limits, class counts).
   - Managing repeater/transfer placements manually using dropdown lists.
   - Checking real-time SEN constraint violations.
   - Rendering a statistics dashboard and previewing student lists with class change options.
2. **Backend (`Python / Flask / openpyxl`)**:
   - Parses annual results, electives, AT marks, and promotion Excel files.
   - Applies the exact mathematical routing and sorting rules.
   - Preserves old student static details (Logins, English names, Houses, G-Suite, etc.) by registry ID.
   - Writes the formatted output Excel with DFKai-SB headers, Times New Roman body text, thin borders, and dynamic Excel COUNTIF summary formulas.

## Reference
- **Source Folder**: `G:\我的雲端硬碟\考評\2025-2026\1. Source`
- **Vite React App**: `C:\Users\CMLO\SORTING-app`
- **Python Backend Server**: `C:\Users\CMLO\SORTING-app\server.py`
- **Output Excel File**: `G:\我的雲端硬碟\考評\2025-2026\25-26_全校分班分組_Generated.xlsx` (suggested default)
