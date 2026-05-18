# NHR Syria Presentation Styling Guidelines (styles.md)
> Feed this guide along with your slide files to any AI (Gamma, ChatGPT, Tome, or Marp) to generate perfectly styled slides.

---

## 🎨 1. Brand Identity & Aesthetic Tone
*   **Vibe:** Professional, medical-clinical, innovative, and highly academic.
*   **Visual Direction:** Minimalist layouts with generous white space, clean borders, and technical precision.
*   **Directionality:** Right-to-Left (RTL) for Arabic text, Left-to-Right (LTR) for English terms, code snippets, and diagrams.

### Color Palette (Hex & Tailwind Specs)
*   **Primary (Trust & Health):** Deep Medical Blue (`#0056b3`) | Tailwind `bg-blue-600`
*   **Secondary (Tech & Focus):** Cyan (`#00a8cc`) | Tailwind `bg-cyan-500`
*   **Accent (Success & Alert):** Green (`#28a745`) for active/dispensed; Amber (`#ffc107`) for warning/waiting lists.
*   **Backgrounds:** Clean White (`#ffffff`) for patient portals; Dark Slate (`#0f172a`) for technical architecture slides.
*   **Typography Colors:** Slate Dark (`#1e293b`) for headings; Charcoal (`#334155`) for readable body text.

---

## 🅰️ 2. Typography & Font Families
*   **Arabic Headings & Text:** Use **Cairo** or **Tajawal** (high-readability modern Sans-serif Arabic fonts).
*   **English & Technical Text:** Use **Inter**, **Roboto**, or **System-ui** (clean, geometric sans-serif fonts).
*   **Code & Schema Blocks:** Use **Fira Code** or **Courier New** for monospaced ASCII art elements.

---

## 📊 3. AI Layout & Visual Grid Rules
*   **Grid Layouts (Two-Column):** If a slide has a sub-list (e.g., "What is Included" vs. "What is Excluded"), divide it into a balanced **left/right split** with light cards.
*   **Diagram Preservation:** Keep ASCII-art diagrams (ERD, Architecture, Data flow) rendered exactly as monospaced blocks inside slate dark containers with a neon cyan border.
*   **Status Badges:** Use rounded borders with color fills for statuses:
    *   `BOOKED` / `WAITING` ──> Amber fill
    *   `COMPLETED` / `DISPENSED` ──> Success Green fill
    *   `ERROR` / `CHALLENGE` ──> Crimson/Red fill

---

## 💻 4. Local Marp Slide Theme Configuration (CSS)
```css
/* If using Marp Markdown Slide compilation */
marp-theme: nhr-syria-theme
@import 'default';

section {
  font-family: 'Tajawal', 'Cairo', 'Inter', sans-serif;
  color: #1e293b;
  background-color: #ffffff;
  padding: 40px;
  direction: rtl; /* Set RTL standard for Arabic */
}

h1, h2, h3 {
  color: #0056b3;
  font-weight: 700;
}

code {
  font-family: 'Fira Code', monospace;
  background-color: #0f172a;
  color: #00a8cc;
}

.left-align {
  direction: ltr;
  text-align: left;
}

.split-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
```
---

## 🤖 5. Prompt for AI Slide Tools (Gamma.app / Tome / ChatGPT)
> **Paste this prompt into your AI slide deck generator:**
> 
> "Please generate a 24-slide professional presentation using the provided Markdown slide files. Ensure the design follows these strict parameters:
> 1. Apply the **NHR Syria Medical/Tech Theme** with Deep Medical Blue (#0056b3) and Cyan (#00a8cc) accents on a crisp white/light gray background.
> 2. For technical slides (Architecture, Database Schema), switch the slide style to a sleek dark mode (#0f172a) with neon cyan code boxes.
> 3. Align all Arabic headings and bullets Right-to-Left (RTL), but keep code snippets and diagrams Left-to-Right (LTR).
> 4. Use Cairo/Tajawal fonts for Arabic text and Inter for English text."
