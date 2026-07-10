---
name: ngpf-design
description: Use this skill to generate well-branded interfaces, decks, one-pagers and copy for NGPF (Next Gen Personal Finance), either for production or throwaway prototypes/mocks. Contains the brand's visual identity, the Copywriting Style Guide, the Copy Catalog (model sentences for every product), and a website + deck UI kit.
user-invocable: true
---

Read README.md, then the two copy references in `docs/`.

## Brand quick-reference

- **Heading font:** PT Sans Bold, upper-and-lower-case — only for the page/document title.
- **Body font:** Montserrat — Bold for sub-heads (h4/h5/h6 ALL CAPS), Regular for body, Italic for quotes.
- **Big metric numbers (100k+ / 5.2M / 33 states): ALWAYS Montserrat Bold — NEVER PT Sans.** Most-violated rule.
- **Primary colors:** `#1f3b9b` (True Blue), `#275ce4` (Bright Blue), `#0b1541` (Midnight).
- **Accents:** `#1db8e8` (Sky), `#f4ad00` (Gold), `#f78219` (Orange).
- **Logo:** horizontal primary on first page + footer of every artifact.
- **Logo color:** **Color (navy + orange) on light surfaces. KO (white) on dark brand surfaces. NEVER all-black.**
- **Avoid:** yellow on `#1f3b9b` or `#275ce4`; full borders on rounded-corner boxes; emoji; gradients.
- **Documents:** one-pagers/reports → PDF. Presentations → PPTX. Match `slides/` for deck layout.

## Voice & copy — non-negotiables

**Frame the teacher, not NGPF.** *"Teachers who use NGPF"*, not *"our teachers"*. *"Together, we can achieve Mission 2030"*, not *"NGPF will achieve…"*. This is the single most-violated rule.

**Term hits to memorize:**

- *no-cost* (formal) / *free* (promo) — never *no cost* or *non-cost*
- *nonprofit* — one word
- *Personal Finance course* (specific class) / *personal finance* (general)
- *Certification Courses* on first reference, then *Cert Courses* or *Certs*
- *professional development* / *PD* — never *training*
- *On-Demand modules* — never *On-Demands*
- *FinCamp* / *FinCap Friday* / *mini-unit* / *Full-Year Course* / *bell ringer* (two words)
- *Guarantee States* (both capitalized) / *guaranteed* (over *mandated* unless writing for lawmakers)
- *speculating in cryptocurrency* — never *investing in cryptocurrency*
- *Bitcoin* (capital B, singular) / *401(k)* / *Buy Now, Pay Later* / *ChatGPT* / *homeowners insurance* (no apostrophe)
- NGPF activities ALL CAPS: *PAYBACK · STAX · MOVE · PLAY · FINE PRINT* · *Influenc'd* (with apostrophe)

**DEI essentials:**

- *low-income* not *poor* · *historically excluded* not *underserved* / *minorities* · *opportunity gap* not *achievement gap*
- *Black* capitalized · *white* lowercase · *Indigenous* capitalized · *Latine* (not *Latinx*) · avoid *brown* and *minority*
- *parents or guardians* in general references · *they/them* when pronouns unknown — never *preferred pronouns*

**Writing rules:**

- Oxford comma · spell out one–nine, numerals 10+ · sentence-start numbers spelled out
- *fewer* for counted, *less* for measured · *percent* w/ number, *percentage* without
- Hyphenate adjective phrases (*three-week course*); don't hyphenate *-ly* (*widely used*)
- Drop *that* if the sentence still works · prefer active voice
- **Banned:** *delve* (ChatGPT tell), *utilize* (always *use*), *very*, *really*

## When asked to write copy

1. First open `docs/copy-catalog.txt` and grep for the product/initiative — there's usually a model Sentence, Bullets, and Paragraph already written for it.
2. Then check `docs/copywriting-style-guide.txt` for term-level rules.
3. Adapt the model copy to fit; never invent from scratch when a model exists.

## When creating visual artifacts

Copy assets out of this skill folder and create static HTML. For production code, read README.md to understand colors, type, components, and patterns.

If invoked without other guidance, ask the user what they want to build, ask a few focused questions (deck vs. one-pager vs. web mock; audience; tone), then act as an expert NGPF designer outputting HTML or production code.
