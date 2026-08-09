# Field Notes — Hugo Static Site & Theme

**Field Notes** is a minimalist, personal multi-topic blog built as a Hugo static site. The design system is meticulously extracted from editorial typography with custom CSS variables, responsive grid structures, Hugo Pipes asset compilation, native taxonomies, and client-side Pagefind search integration.

---

## 📁 Project Structure

```text
Field notes/
├── content/                     # Content directory organized by topic sections
│   ├── books/                   # Books section (_index.md + book notes/reviews)
│   ├── issue/                   # Issue section (_index.md + markdown essays)
│   ├── life/                    # Life section (_index.md + markdown essays)
│   ├── nature/                  # Nature section (_index.md + markdown essays)
│   ├── science/                 # Science section (_index.md + markdown essays)
│   ├── tech/                    # Tech section (_index.md + markdown essays)
│   ├── about.md                 # Standalone About page
│   └── contact.md               # Standalone Contact page
├── data/
│   ├── authors.yaml             # Config-driven author profiles
│   └── sections.yaml            # Config-driven blog topic sections
├── themes/
│   └── field-notes/             # Custom theme built from scratch
│       ├── assets/              # Theme assets processed by Hugo Pipes
│       │   ├── css/             # Modular CSS partials
│       │   │   ├── tokens.css   # Color palette swatches & CSS custom properties
│       │   │   ├── base.css     # Typography resets & base rules
│       │   │   ├── components.css # Nav, hero, card grid, callout, footer, modal
│       │   │   ├── layout.css   # Breakpoints (900px, 640px) & reduced motion
│       │   │   └── main.css     # Entry stylesheet bundle
│       │   └── js/
│       │       └── search.js    # Pagefind search modal & keyboard shortcuts ('/')
│       ├── layouts/             # Hugo HTML templates
│       │   ├── _default/        # Base layout (baseof.html), list, single, terms
│       │   ├── page/            # Single page layout for About & Contact
│       │   ├── index.html       # Homepage grid & hero layout
│       │   └── partials/        # Component templates (head, nav, hero, post-card, etc.)
│       └── theme.toml           # Theme manifest
├── go.mod                       # Hugo Module declaration
├── hugo.toml                    # Site configuration & topic color parameters
├── .gitignore                   # Git ignore file for Hugo & Pagefind outputs
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Hugo Extended](https://gohugo.io/installation/) (`v0.110.0` or newer) and [Go](https://go.dev/dl/) (`1.20+`) installed for Hugo Modules support.

```bash
hugo version
go version
```

### Running Locally

Start the local development server with draft rendering enabled:

```bash
hugo server -D
```

Navigate to `http://localhost:1313/` in your browser.

---

## 🗂️ Adding & Managing Topic Sections

Topic sections (`issue`, `life`, `nature`, `science`, `tech`) are fully **config-driven** via `data/sections.yaml`.

### To Add a New Section:

1. **Add entry to `data/sections.yaml`**:
   ```yaml
   philosophy:
     name: "Philosophy"
     description: "Notes on ethics, human thought, and mental models."
     color: "var(--clay)"
   ```
2. **Create section folder and `_index.md`**:
   Create `content/philosophy/_index.md`:
   ```yaml
   ---
   title: "Philosophy"
   description: "Notes on ethics, human thought, and mental models."
   ---
   ```
3. **Write posts**: Place markdown posts in `content/philosophy/my-essay.md`.

_Zero theme template modifications required! The new section automatically updates the navigation dropdown menu, homepage filter tabs, post card tags, meta strips, and archive listings._

---

## ✍️ Adding New Posts

To create a new essay under one of the topic sections (`issue`, `life`, `nature`, `science`, `tech`), create a markdown file under `content/<topic>/<post-title>.md`.

### Front Matter Schema

Every post should include the following YAML front matter fields:

```yaml
---
title: "Title of your essay"
date: 2026-08-03T10:00:00Z
draft: false
author: "prana"
categories: ["nature"] # Topic section (issue, life, nature, science, tech)
tags: ["wildlife", "corvids"] # Native Hugo tags
cover: "cover.jpg" # Optional cover image path or URL
cover_caption: "Photograph of street crows in morning light"
summary: "A short 1-2 sentence preview for post cards."
description: "Compelling meta description for OpenGraph and SEO."
---
```

### Topic Accent Colors

Each post automatically inherits its topic swatch indicator and theme styling based on its primary category/section (`issue`, `life`, `nature`, `science`, `tech`).

Topic colors are mapped to CSS variables in `themes/field-notes/assets/css/tokens.css`:

| Topic       | Class        | Color Hex / CSS Token              |
| :---------- | :----------- | :--------------------------------- |
| **Issue**   | `.t-issue`   | `#9C7C38`                          |
| **Life**    | `.t-life`    | `#C1502E` (`var(--clay)`)          |
| **Nature**  | `.t-nature`  | `#2E5941` (`var(--moss)`)          |
| **Science** | `.t-science` | `#8A6D3B` (`var(--topic-science)`) |
| **Tech**    | `.t-tech`    | `#55606B` (`var(--slate)`)         |
| **Books**   | `.t-books`   | `#6B4E71` (`var(--topic-books)`)   |

---

## 🔍 Building & Pagefind Search Integration

Client-side search uses [Pagefind](https://pagefind.app/). To build the static site and index the content for search:

```bash
# 1. Build the static site into public/
hugo --minify

# 2. Generate Pagefind index
npx pagefind --site public
```

When users click the magnifying glass (`⌕`) icon in the navigation or press the `/` key on their keyboard, an accessible search modal overlay appears for instant full-text searching across all published essays.

---

## 🏷️ Features & Architecture Highlights

- **Authoritative Design System**: Extracted font families (_Fraunces_, _Inter_, _JetBrains Mono_), paper color background (`#F6F1E9`), card backgrounds (`#EDE4D3`), and dark accent callouts (`#181614`).
- **Hugo Pipes Asset Pipeline**: CSS partials are concatenated, minified, and fingerprinted automatically at build time.
- **Native Taxonomies**: Standard Hugo `categories` and `tags` driving related content recommendations via Hugo's `.Site.RegularPages.Related`.
- **Responsive Layout**: Seamless transition from 3-column grid to 2-column (900px breakpoint) and single-column (640px mobile breakpoint).
- **Accessibility & Motion**: Includes focus indicators, ARIA modal attributes, semantic HTML5 structure, and `prefers-reduced-motion` compliance.

---

## 🛠️ Complete TOML & YAML Configuration Reference

Everything configurable on the website can be created, updated, or deleted directly via TOML or YAML configuration files:

### 1. `hugo.toml` (Global Site Parameters)

| Parameter                    | Description           | Where It Appears                                         |
| :--------------------------- | :-------------------- | :------------------------------------------------------- |
| `title`                      | Site Title            | Browser tab, RSS title, and header logo (`Field Notes.`) |
| `baseURL`                    | Main site URL         | Canonical URLs, RSS feed link, OpenGraph meta tags       |
| `paginate`                   | Grid item limit       | Post cards shown per page grid (default: `12`)           |
| `params.eyebrow`             | Author eyebrow text   | Top eyebrow line in Hero banner (`Parminder S Rana`)     |
| `params.headline_html`       | Main hero title       | Hero banner headline (supports `<em>` formatting)        |
| `params.sub`                 | Hero subtitle text    | Subtitle description under hero headline                 |
| `params.hero_image`          | Hero background image | Background image of hero banner (`images/hero-bg.webp`)  |
| `params.copyright`           | Copyright statement   | Footer bottom bar (`© 2025-26 Field Notes`)              |
| `params.author_key`          | Primary author ID     | Default author lookup for About page and cards (`prana`) |
| `params.newsletter_k`        | Newsletter eyebrow    | Newsletter callout box badge                             |
| `params.newsletter_title`    | Newsletter title      | Newsletter callout box main heading                      |
| `params.newsletter_sub`      | Newsletter subtitle   | Newsletter callout box description                       |
| `params.contactFormEndpoint` | Form submit URL       | Form action URL for newsletter & contact forms           |

### 2. `data/sections.yaml` (Blog Topic Sections)

- **Create**: Add a new key (e.g. `history: name: "History", description: "...", color: "#..."`) to add a brand new topic section.
- **Update**: Edit `name`, `description`, or `color` to instantly update topic branding.
- **Delete**: Remove a section key to hide it from navigation and filter tabs (_posts remain 100% published and safe_).
- **Auto-integrates into**: Posts nav dropdown, Homepage filter tabs, Footer links, Post card tags, and Meta strips.

### 3. `data/authors.yaml` (Author & Contributor Profiles)

- **Create/Update/Delete**: Add or modify author profile blocks:
  ```yaml
  "Parminder S Rana":
    name: "Parminder S Rana"
    avatar: "images/authors/prana.jpg"
    bio: "Essays on living closely, paying attention, and making sense of modern technology."
    role: "Writer and Editor"
    social:
      twitter: "https://twitter.com/..."
      linkedin: "https://linkedin.com/in/..."
  ```
- **Auto-integrates into**: Post author mini bylines, Author cards, Single post footers, and About page profile banner.

### 4. Post Front Matter (YAML inside `.md` files)

| Field           | Description                                         |
| :-------------- | :-------------------------------------------------- |
| `title`         | Essay / post title                                  |
| `date`          | Timestamp (`YYYY-MM-DDTHH:MM:SSZ`)                  |
| `draft`         | Set `true` to hide post from production builds      |
| `author`        | Author key matching `data/authors.yaml` (`prana`)   |
| `categories`    | Section array (`["nature"]`, `["tech"]`, etc.)      |
| `tags`          | Topic tags (`["wildlife", "corvids"]`)              |
| `cover`         | Path or external URL for post card cover image      |
| `cover_caption` | Caption shown below cover image                     |
| `summary`       | Custom post card excerpt text                       |
| `description`   | Meta description for search engines & social cards  |
| `book_author`   | Book author name (_used for `books` section posts_) |
