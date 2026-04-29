# Agent guidelines

## Git: never push

Do not run `git push` under any circumstances. Staging, committing, branching, and rewriting local history are fine when the task calls for them, but pushing to a remote is always the human's call. If you believe a push is the right next step, stop and tell the user what you would push and to which branch, then wait for them to do it.

This applies to every remote and every variant: `git push`, `git push --force`, `git push origin`, pushing tags, pushing from inside scripts, and so on.

## Git: commit messages explain the why

Commit messages must explain why a change is being made, not what the change is. The diff already shows what changed; the commit message exists to capture the business context, the problem being solved, or the reasoning the reader cannot recover from the code alone. Keep the description to roughly one paragraph, and only add more paragraphs when extra context genuinely helps the reader understand the motivation.

Hard-wrap commit messages at the standard Git widths: subject line ≤ 50 characters (60 is tolerable when it really helps), a blank line, then the body wrapped at 72 columns. These are the widths `git log`, GitHub, and most terminals assume, so wrapping at the source keeps messages readable everywhere without mid-word breaks.

## Verifying visual changes

When a change affects HTML, CSS, images, or anything else that alters how a landing page renders, run the `render-page` skill on the affected file and inspect **both** the desktop and mobile PNGs it returns before declaring the work done. Checking only one viewport is not enough — a change that looks correct on desktop can still break the mobile layout (and vice versa), so every visual change must be verified on both layouts. The skill spawns headless Firefox via geckodriver, writes two full-page screenshots to a temp directory, and prints their paths so the agent can `read` them back as image attachments. Invoke it as `/skill:render-page <file>` or directly with `./.pi/skills/render-page/target/release/render-page <file>`; see `.pi/skills/render-page/SKILL.md` for setup (the binary needs `cargo build --release` once) and for the Firefox mobile-width quirk.

This rule covers the top-level `*.html` pages (`index.html`, `ai-onboarding.html`, `customer-flow.html`, `restaurant-kitchen.html`, `restaurant-operations.html`), anything under `assets/`, and any file those pages reference. Pure copy edits that clearly cannot change layout — fixing a typo inside an existing paragraph, for instance — can skip the render step at the author's discretion, but when in doubt, render.

# Documentation style

Write documentation the way a journalist writes a news story, not the way a manual lists features. The reader should be able to stop reading at any paragraph and still walk away with the context they need.

## Voice and tone

Use active voice. Always. Name the actor and the action directly: "The script reads the config file," not "The config file is read by the script." Passive constructions hide who does what and slow the reader down, so avoid them even when they feel more polite or formal.

Keep the messaging direct. Say what something does, what the reader should do, or what the consequence is — without hedging, throat-clearing, or filler like "it is worth noting that" or "you may want to consider." If it matters, state it. If it doesn't, cut it.

## Structure: inverted pyramid

Lead with the conclusion. The first paragraph should answer the reader's most likely question — "does this work?", "how do I do X?", "what went wrong?" — in plain terms. Supporting detail, caveats, edge cases, and background come after, in descending order of importance.

This means a reader who bails after the first paragraph still leaves with the answer. A reader who continues gets progressively more nuance. A reader who reads to the end gets the full picture, including the footnotes they probably didn't need.

## Prefer paragraphs to bullets

Write in paragraphs by default. Prose carries reasoning, cause-and-effect, and nuance that bullet lists flatten into disconnected fragments. When ideas connect — "we do X because Y, which means Z" — a paragraph shows that relationship; a bullet list hides it.

Reach for bullets only when the content genuinely is a list: discrete, parallel items with no narrative connecting them (install steps, a set of flags, a checklist). If you find yourself writing bullets that each contain a full sentence of explanation, that's prose pretending to be a list. Convert it back.

## Tables

Use tables only when they make a comparison or lookup easier to understand than prose would. A good table has at least two columns the reader will actually scan across — options vs. behavior, environments vs. config values, error codes vs. meanings.

Do not use tables as a layout trick to make a page look organized. A two-column table where the second column is a paragraph of prose is worse than the paragraph alone.

## The "stop anywhere" test

Before finishing, reread the document and ask: if someone stopped at the end of this paragraph, would they understand what this is about and what to do next? If not, move the missing context earlier or tighten the paragraph so it stands on its own.
