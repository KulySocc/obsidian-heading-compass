# Heading Compass

An Obsidian plugin for fast heading navigation. Provides two complementary UIs for jumping to headings in the active note.

## Language

**Heading**:
An ATX Markdown heading (H1–H6) parsed from the active note's source text.
_Avoid_: section, anchor, item

**Heading palette**:
The fuzzy-search modal UI for searching and jumping to a heading. Opened via command or hotkey, dismissed on selection or Escape.
_Avoid_: command palette, quick open, modal

**Floating outline**:
The always-visible sidebar panel that lists headings for the active note and allows click navigation.
_Avoid_: outline panel, sidebar, TOC, table of contents

**Active heading**:
The heading currently under the cursor (source mode) or at the top of the visible viewport (preview mode).
_Avoid_: current heading, selected heading, focused heading

**Contextual children**:
Hidden sub-headings (at a filtered-out level) that are revealed in the floating outline when their ancestor heading becomes active.
_Avoid_: expanded children, revealed headings, child items

**Enabled levels**:
The set of heading levels (H1–H6) currently configured to appear in a given UI. Each UI (palette, floating outline) has its own enabled levels.
_Avoid_: visible levels, active levels, shown levels

## Example dialogue

> "Why isn't H3 showing up in the outline?"
> "Check the enabled levels for the floating outline — H3 might be toggled off."
>
> "The active heading jumped when I scrolled past a subheading."
> "That subheading is probably a contextual child — it appears because its parent heading became active."
>
> "Does the heading palette use the same levels as the floating outline?"
> "No — each UI has its own enabled levels configured separately."
