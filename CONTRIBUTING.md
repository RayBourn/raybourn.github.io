# Contributing to Field Notes

Thank you for contributing to Field Notes! Below is the complete guide for adding content, authors, and managing site data.

---

## Adding a new author and post

To publish a post by a new author:

### Step 1: Add profile in `data/authors.yaml`
Open `data/authors.yaml` and add the author profile using their full name as the key:

```yaml
"Robert Brown":
  name: "Robert Brown"
  avatar: "images/authors/rbrown.jpg"
  bio: "Essays on history, architecture, and quiet routines."
  role: "Contributor"
  social:
    twitter: "https://twitter.com/..."
    linkedin: "https://linkedin.com/in/..."
```

*(Optional: Place their photo at `assets/images/authors/rbrown.jpg`)*

### Step 2: Write your post and set `authors`
In your post markdown file (e.g. `content/life/my-new-essay.md`), set `authors` to their full name:

```yaml
---
title: "My New Essay"
date: 2026-08-08T00:00:00Z
draft: false
authors: "Robert Brown"
categories: ["Life"]
---
```
title: "My New Essay"
date: 2026-08-08T00:00:00Z
draft: false
author: "Robert Brown"
categories: ["Life"]
---
```
author: "jsmith"
categories: ["nature"]
tags: ["botany", "micro-ecosystems"]
---
```

---

## Creating a New Post

To create a new post using Hugo archetypes:

```bash
hugo new posts/my-new-essay.md
```

This will populate front matter with `author: "prana"` by default, which can be updated to any registered author key.

---

## Managing Sections

Topic sections (such as `life`, `nature`, `science`, `tech`, `books`) are fully config-driven via `data/sections.yaml`.

### Adding a New Section
To add a new topic section:
1. Open `data/sections.yaml`.
2. Add a new section entry using a unique lowercase key (e.g. `history`):
   ```yaml
   history:
     name: "History"
     description: "Historical essays, archival notes, and micro-histories."
     color: "#8c6d53"
   ```
3. Done! The new section will automatically appear in navigation dropdowns, filter bars, and card metadata across the site.

### Removing a Section
To remove an existing section:
1. Open `data/sections.yaml`.
2. Delete the section entry (e.g. remove `nature:`).
3. Done!

> [!IMPORTANT]
> **Data Safety Guarantee**: Removing a section entry from `data/sections.yaml` does **NOT** delete, unpublish, or hide any posts tagged with that section. 
> - Existing post markdown files remain 100% untouched and published.
> - The posts continue to render normally everywhere (homepage feed, archive list, RSS feeds, search index, and their own permalink URLs).
> - The section label in the post's meta-strip gracefully falls back to showing the raw title-cased section name as plain text without broken links.
> - You may optionally re-assign posts to a different active section in their front matter if desired.
