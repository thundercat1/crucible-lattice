# Claude Instructions — Crucible Lattice

Before editing anything in this directory, read [VISION.md](VISION.md) for the product vision. Every copy decision should be consistent with it.

## Voice

Crucible Lattice's voice is that of an **AI-native, technically confident specialty-chemistry infrastructure company** — closer to Palantir, Schrödinger, or Recursion than to a consumer SaaS product. The reader is a chemist, a manufacturing lead, a pharma operations director, a defense program manager, or the investor funding them. They are serious, time-poor, and allergic to hype.

### Do

- **Lead with capability and outcome**, not product features. "From structure to supply chain, in seconds" — not "We'll help you find manufacturers."
- **Use industry vocabulary naturally.** Retrosynthesis, E-factor, MOQ, cGMP, REACH, ITAR, genotox, Pareto front. Don't over-explain — the audience knows these terms, and using them signals competence.
- **Be specific and numeric.** "2,413 qualified partners," "−56% cost per kg," "≥99.8% purity with <5 ppm trace metals." Vague claims read as vaporware; precise ones read as real.
- **Stay confident and declarative.** Short sentences. Active verbs. No hedging modifiers ("really," "quite," "kind of").
- **Name the mechanism when describing intelligence.** "Matching Morgan fingerprints to partner tooling" beats "smart matching." If we can't name the mechanism, the claim is probably too soft to make.

### Don't

- **Avoid consumer-casual phrasing.** "Drop in a compound. We'll find the best way to make it." reads as cute and undermines credibility. Replace with direct technical framing.
- **Avoid first-person plural warmth** ("we'll help you," "let us"). The system is an engine, not a concierge.
- **Avoid generic AI/marketing language.** No "seamless," "revolutionary," "cutting-edge," "AI-powered," "game-changing." No emoji.
- **Avoid exclamation points.** Ever.
- **Don't hide complexity behind euphemism.** If something is regulated, say regulated. If it's ITAR-restricted, say ITAR. The audience wants to see that we see the real constraints.

### Voice tests

Before shipping copy, apply these:

1. **Would a Schrödinger PM write this?** If it reads consumer or cutesy, rewrite.
2. **Is there a number, a named mechanism, or an industry term that would make this sharper?** Usually yes.
3. **Does it survive being read by a skeptical procurement director?** Hype language fails this test instantly.

### Examples

| Weak                                              | Strong                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| "Drop in a compound. We'll find the best way."   | "From structure to supply chain, in seconds."                        |
| "Our smart AI finds great partners."             | "Matches Morgan fingerprints against a graph of 2,413 qualified partners." |
| "Sustainable chemistry, made easy."              | "Biocatalytic step-2 and solvent recovery cut E-factor by 58%."      |
| "Every transaction makes us smarter!"            | "Every transaction tightens cost, lead-time, and risk estimates on the next run." |

## Scope of this document

This file governs voice and copy decisions for the Crucible Lattice demo — the marketing-facing language in the UI, any future README, and pitch materials that live in this directory. It does not govern code style (see the repo-root `CLAUDE.md` for that).

When voice guidance here conflicts with the repo-root `CLAUDE.md`, this file wins **for user-facing copy in Crucible Lattice**. Everything else — project structure, safety rails, git practices — defers to the root file.
