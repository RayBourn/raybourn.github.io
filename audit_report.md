# Field Notes — Hugo Static Site Audit Report

Comprehensive audit of the entire Hugo repository: `content/`, `layouts/`, `static/`, `assets/`, `data/`, `config`, `archetypes`, and JS/CSS pipelines.

---

## 1. BUGS

### 1.1 Potential nil-pointer / panic risks

| Severity | File | Line(s) | Issue |
|----------|------|---------|-------|
| 🔴 HIGH | [index.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/index.html#L18) | L18 | `{{ $latestPost := index $allPosts 0 }}` — will **panic** if `$allPosts` is empty (e.g. all posts are draft). Needs a `{{ if gt (len $allPosts) 0 }}` guard. |
| 🔴 HIGH | [section/books.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/section/books.html#L5) | L5 | `{{ $latestRead := index $books 0 }}` — same nil-index panic if no book pages exist. |
| 🔴 HIGH | [books/list.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/books/list.html#L5) | L5 | `{{ $latestRead := index $books 0 }}` — identical nil-index panic. |
| 🟡 MED | [author-mini.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/partials/author-mini.html#L21) | L21 | `{{ $authorData = index . $authorKey }}` — if `$authorKey` doesn't match any key in `authors.yaml`, `index` returns `nil`. The subsequent `if not $authorData` fallback (L35) saves it, but the intermediate `index . ($authorKey \| lower)` on L23 will also return nil and that's fine — just verbose. |
| 🟡 MED | [archive.html (page)](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/page/archive.html#L12) | L12 | `$maxPosts := .Site.Params.paginate` — this reads `.Site.Params.paginate` (a params key) but Hugo's paginate is set as a top-level config key (`paginate = 12`), not under `[params]`. This will always resolve to the `default 12` fallback, which happens to match — harmless now but semantically wrong and fragile. |

### 1.2 Broken / dead asset references

| Severity | File | Issue |
|----------|------|-------|
| 🟡 MED | [static/pagefind/](file:///d:/Blogging/Field%20notes/static/pagefind) | **Orphaned Pagefind assets**. `pagefind-ui.js` (72 bytes) and `pagefind-ui.css` (16 KB) are shipped to production via `static/`. The JS file imports `"./ui-core"` which doesn't exist — it will 404 and throw a console error. These files are no longer referenced from `head.html` (tags were removed earlier) but they still get copied to `public/pagefind/` on every build, wasting bandwidth. **Delete `static/pagefind/` entirely.** |
| 🟡 MED | [static/images/](file:///d:/Blogging/Field%20notes/static/images) | `about-hero.png` (888 KB), `ah.jpg` (252 KB), `discipline.jpg` (977 KB) are duplicated in **both** `static/images/` and `assets/images/`. Hugo Pipes only reads from `assets/`. The `static/` copies are never used by templates and just bloat the deploy. Same for `static/images/authors/` — identical files exist in `assets/images/authors/`. |
| 🟢 LOW | [static/fonts/](file:///d:/Blogging/Field%20notes/static/fonts) | 5 font files shipped (4 × Atkinson Hyperlegible, 1 × Fraunces). **Zero CSS `@font-face` rules exist** anywhere in the codebase. These fonts are loaded from Google Fonts CDN instead. The local files are completely dead weight (~114 KB). |

### 1.3 Hugo build warnings (10 unused templates)

The `--printUnusedTemplates` flag reports **10 unused template files**:

| Template | Source File | Why Unused |
|----------|-------------|------------|
| `/_default/archive.html` | [archive.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/_default/archive.html) | The `archive.md` content uses `layout: "archive"` but Hugo resolves it via `page/archive.html` instead. This 125-line file is **dead code**. |
| `/_default/terms.html` | [terms.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/_default/terms.html) | Overridden by `authors/terms.html` for the only taxonomy with a terms page. Tags/categories terms pages use the default list template. |
| `/list.json` | [list.json](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/_default/list.json) | Identical copy of `index.json`. Only the home-page JSON output is used (defined in `[outputs]`). Section-level JSON outputs are not enabled. |
| `/_shortcodes/float-img.html` | [float-img.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/shortcodes/float-img.html) | **No content files use `{{</* float-img */>}}`**. The shortcode was built but never invoked. |
| `/authors/terms.html` | [authors/terms.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/authors/terms.html) | Hugo's template lookup doesn't match this path for the authors taxonomy listing. |
| `/books/list.html` | [books/list.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/books/list.html) | Overridden by `section/books.html`, which Hugo picks first. |
| `/page/archive.html` | [page/archive.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/page/archive.html) | Reported unused but `archive.md` sets `layout: "archive"` — Hugo may resolve via `_default/archive.html` instead. **Verify which one is actually rendering.** |
| `/page/single.html` | [page/single.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/page/single.html) | Pages like `contact.md` and `privacy.md` render through `_default/single.html` instead. |
| `/section/books.html` | [section/books.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/section/books.html) | Reported unused — but `books/_index.md` exists, so this should be resolving. May be a Hugo lookup order edge case. |
| `/_default/terms.html` (dup) | Same file flagged twice. |

### 1.4 Config / meta issues

| Severity | File | Line | Issue |
|----------|------|------|-------|
| 🟡 MED | [hugo.toml](file:///d:/Blogging/Field%20notes/hugo.toml#L1) | L1 | `baseURL = 'https://example.org/'` — **placeholder domain**. RSS feeds, sitemaps, canonical URLs, and OG meta tags all emit `https://example.org/` as the production URL. |
| 🟡 MED | [hugo.toml](file:///d:/Blogging/Field%20notes/hugo.toml#L2) | L2 | `locale = 'en-us'` — Hugo doesn't recognize `locale` as a top-level key. The correct key is `languageCode`. `baseof.html` L2 reads `.Site.Language.Locale` which falls back to `"en"` anyway. |
| 🟡 MED | [hugo.toml](file:///d:/Blogging/Field%20notes/hugo.toml#L21-L22) | L21-22 | **Duplicate taxonomy**: `author = 'authors'` AND `authors = 'authors'`. Both map to the same taxonomy. Only one is needed. |
| 🟢 LOW | [hugo.toml](file:///d:/Blogging/Field%20notes/hugo.toml#L59) | L59 | `contact_email = "hello@example.org"` — placeholder. Same placeholder appears in `content/contact.md` L14. |

---

## 2. REDUNDANT / DUPLICATE CODE

### 2.1 Duplicate template files

| Files | Issue |
|-------|-------|
| [index.json](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/index.json) + [_default/list.json](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/_default/list.json) | **Byte-for-byte identical** (481 bytes each). `list.json` is unused (see build warnings). Delete it. |
| [books/list.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/books/list.html) vs [section/books.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/section/books.html) | **Near-identical** books listing templates (~85% overlap). Both query `$books`, split `$latestRead` / `$shelfBooks`, render `featured-book.html`, and list remaining books. Only minor differences in hero markup and heading text. Consolidate into one. |
| [_default/archive.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/_default/archive.html) vs [page/archive.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/page/archive.html) | **Two archive templates** with substantially overlapping logic (hero + tag filtering + grouped list). One is unused; delete it. |

### 2.2 Duplicate author-lookup logic (3× copy-paste)

The same ~30-line author-resolution pattern (check `$authorKey`, fallback to `lower`, fuzzy-match by `name`, `urlize`) is **copy-pasted verbatim** across:

1. [author-card.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/partials/author-card.html#L1-L28) (L1-28)
2. [author-byline.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/partials/author-byline.html#L1-L37) (L1-37)
3. [author-mini.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/partials/author-mini.html#L1-L33) (L1-33)
4. [latest-feed.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/partials/latest-feed.html#L44-L73) (L44-73)
5. [authors/list.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/authors/list.html#L3-L18) (L3-18)
6. [about/single.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/about/single.html#L49-L63) (L49-63)

> [!TIP]
> Extract a `partials/resolve-author.html` that takes `$authorKey` and returns `$authorData`. Call it from all 6 locations. This eliminates ~150 lines of duplicated code and ensures consistent fallback behavior.

### 2.3 Duplicate hero-image resolution (~30-line block, 3× pasted)

The hero background image resolution logic (try `resources.Get`, fallback `GetMatch`, SVG check, resize to 1920x webp) is repeated in:

1. [hero.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/partials/hero.html#L2-L34) (L2-34)
2. [about/single.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/about/single.html#L4-L37) (L4-37)
3. [_default/archive.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/_default/archive.html#L3-L36) (L3-36)
4. [section/books.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/section/books.html#L12-L28) (L12-28)

> [!TIP]
> Extract a `partials/hero-bg.html` partial. The `about/single.html` and `archive.html` templates could just call `{{ partial "hero.html" . }}` instead of inlining the entire hero block.

### 2.4 Duplicate cover-image resolution (~20-line block, 4× pasted)

The cover image resolution pattern (external URL check, `resources.Get`, `GetMatch`, SVG check, resize, fallback `relURL`) is repeated in:

1. [post-card.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/partials/post-card.html#L7-L38) (L7-38)
2. [single.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/_default/single.html#L27-L62) (L27-62)
3. [featured-book.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/partials/featured-book.html#L24-L45) (L24-45)
4. [latest-feed.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/partials/latest-feed.html#L82-L106) (L82-106)
5. [section/books.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/section/books.html#L74-L96) (L74-96)

### 2.5 Duplicate book-hero illustration lookup (6-format chain, 2×)

The `book-hero.png` → `.jpg` → `.jpeg` → `.webp` → `.gif` → `.svg` fallback chain is pasted identically in:

1. [section/books.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/section/books.html#L37-L50) (L37-50)
2. [books/list.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/books/list.html#L19-L32) (L19-32)

### 2.6 Duplicate static images

| `static/images/` | `assets/images/` | Size |
|-------------------|------------------|------|
| `ah.jpg` | `ah.jpg` | 252 KB (identical) |
| `discipline.jpg` | `discipline.jpg` | 977 KB (identical) |
| `authors/author.jpg` | `authors/author.jpg` | 84 KB (identical) |
| `authors/adowe.jpg` | `authors/adowe.jpg` | 84 KB (identical) |
| `authors/jsmith.jpg` | `authors/jsmith.jpg` | 84 KB (identical) |

Templates use `resources.Get` which reads from `assets/`. The `static/` copies are never used. Delete `static/images/` entirely (or keep only files that are **not** in `assets/images/`).

### 2.7 Unused CSS pipeline files

| File | Issue |
|------|-------|
| [main.css](file:///d:/Blogging/Field%20notes/themes/field-notes/assets/css/main.css) | 5-line `@import` manifest. **Not referenced anywhere** — `head.html` uses Hugo Pipes `resources.Concat` to manually stitch CSS files. This file is dead code. |
| [components.css](file:///d:/Blogging/Field%20notes/themes/field-notes/assets/css/components.css) | 21-line `@import` manifest. Same situation — not referenced by any template. Dead code. |

---

## 3. DEAD CONFIG ENTRIES

### 3.1 Unused `[params.features]` flags

**All 5 feature flags** in [hugo.toml L69-74](file:///d:/Blogging/Field%20notes/hugo.toml#L69-L74) are **never read** by any template:

| Flag | Value | Usage |
|------|-------|-------|
| `enable_search` | `true` | Search is always rendered unconditionally. |
| `enable_dark_mode` | `true` | Theme toggle is always rendered unconditionally. |
| `enable_pagefind` | `true` | Pagefind was removed. Flag is completely dead. |
| `enable_related_posts` | `true` | Related posts are always shown in `single.html` without checking this flag. |
| `show_reading_time` | `true` | Reading time is always shown in `meta-strip.html` without checking. |
| `show_share_buttons` | `true` | No share button markup exists anywhere. Completely dead. |

### 3.2 Unused `[params.social]` block

[hugo.toml L62-66](file:///d:/Blogging/Field%20notes/hugo.toml#L62-L66) defines `params.social` (twitter, linkedin, github, website). **No template reads `site.Params.social`**. Author social links come from `data/authors.yaml` instead. This entire block is dead config.

### 3.3 Unused config keys

| Key | Issue |
|-----|-------|
| `locale = 'en-us'` (L2) | Not a valid Hugo config key. Should be `languageCode`. |
| `author_role` (L41) | Never read by any template. Author roles come from `data/authors.yaml`. |
| `turnstileSiteKey = ""` (L58) | Set to empty string — Turnstile widget never renders. If not planning to use it, remove. |

---

## 4. PERFORMANCE & BEST PRACTICES

### 4.1 Google Fonts: 7 families loaded, 4 actually used

[head.html L72](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/partials/head.html#L72) loads **7 Google Font families** in a single request:

| Font | Used in CSS? |
|------|-------------|
| Faustina | ✅ Yes (article prose) |
| Fraunces | ✅ Yes (headings) |
| Inter | ✅ Yes (body/UI) |
| JetBrains Mono | ✅ Yes (mono accents) |
| Lora | ⚠️ Used once — `search.css` `.live-search-empty` only |
| Noto Sans | ❌ **Never used** |
| Roboto Slab | ❌ **Never used** |

> [!IMPORTANT]
> Remove `Noto+Sans` and `Roboto+Slab` from the Google Fonts URL. Consider removing `Lora` too (or replace the one usage with Faustina). Each unused family adds ~20-50 KB of font data and an extra render-blocking resource.

### 4.2 Inline styles in templates

Several templates use extensive `style="..."` attributes instead of CSS classes:

- [authors/terms.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/authors/terms.html) — 12 inline `style` attributes
- [page/archive.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/page/archive.html) — 8 inline `style` attributes
- [featured-book.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/partials/featured-book.html) — 6 inline `style` attributes
- [authors/list.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/authors/list.html) — 6 inline `style` attributes
- [hero.html](file:///d:/Blogging/Field%20notes/themes/field-notes/layouts/partials/hero.html#L37) — eyebrow has full inline style

These defeat CSS bundling/minification and make dark mode / responsive harder to maintain.

### 4.3 `about-hero.png` is 888 KB

[static/images/about-hero.png](file:///d:/Blogging/Field%20notes/static/images/about-hero.png) is a nearly 1 MB PNG. No template references it. If it's meant for the about page hero, it should be in `assets/images/` and processed through Hugo Pipes (resize + webp conversion).

---

## 5. CONTENT / ARCHETYPE ISSUES

### 5.1 Archetype `posts.md` doesn't match any section

[archetypes/posts.md](file:///d:/Blogging/Field%20notes/archetypes/posts.md) — there's no `content/posts/` section. Content sections are `issue/`, `life/`, `nature/`, `science/`, `tech/`, `books/`. This archetype is never triggered by `hugo new`. Consider renaming or creating section-specific archetypes.

### 5.2 `issue/` section has no content

`content/issue/_index.md` exists, but there are **zero regular pages** inside `content/issue/`. The section appears in the nav dropdown and footer but links to an empty page.

### 5.3 `nature/` section has no content

`content/nature/_index.md` exists, but there are **zero regular pages** inside `content/nature/`. Same empty-link issue.

### 5.4 Content uses `authors` (plural) but taxonomy expects both forms

All content front matter uses `authors: "Parminder S Rana"` (string, not array). The author-resolution partials check both `author` and `authors` params. This works, but is inconsistent — some content might use `author` (singular) causing lookup mismatches.

---

## 6. SUMMARY TABLE

| Category | Count | Action |
|----------|-------|--------|
| 🔴 Potential panics (nil index) | 3 | Add `len` guards |
| 🟡 Dead/orphan assets | 3 dirs | Delete `static/pagefind/`, `static/images/` dupes, `static/fonts/` |
| 🟡 Unused templates | 10 | Delete 7, consolidate 3 |
| 🟡 Duplicate template logic | 4 patterns | Extract partials |
| 🟡 Dead config entries | 9 keys | Remove from `hugo.toml` |
| 🟢 Unused Google Fonts | 2-3 families | Remove from URL |
| 🟢 Unused CSS files | 2 | Delete `main.css`, `components.css` |
| 🟢 Inline styles | 4 templates | Migrate to CSS classes |
| 🟢 Empty content sections | 2 | Add content or remove nav links |

---

> [!NOTE]
> The site builds successfully with zero errors. All 10 warnings are for unused templates. No broken `ref`/`relref` calls exist (none are used — all internal links use `relLangURL` or `RelPermalink`). RSS and sitemap generate correctly.
