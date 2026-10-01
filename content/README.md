# 4DMalaya Content Pack — 10 Articles, 50 Images, SEO Map

Everything is written and built. Your job is publishing, not writing.

## What is in this folder

```
articles/
  01-4d-result-today/            article.md + images/ (5 images: webp, png, svg/)
  02-4d-results-history/
  03-4d-prize-structure/
  04-how-to-check-4d-result-online/
  05-4d-draw-schedule/
  06-types-of-4d-bets/
  07-4d-winnings-tax-malaysia/
  08-4d-odds-probability/
  09-most-frequent-4d-numbers/
  10-is-4d-legal-malaysia/
seo-master.csv          titles, meta descriptions, focus keywords, BM variants, publish order
images-manifest.csv     every image: file, alt text, caption, dimensions
build-images.mjs        regenerate all 50 images after edits: node build-images.mjs
lib-svg.mjs, data-a.mjs, data-b.mjs   image engine + image content
```

Each article folder is self-contained: one markdown file, five images. Upload the folder contents, nothing else needed.

## Publish order (do not randomise this)

| Day | Article | Why |
|---|---|---|
| Mon | 01 4d-result-today | Money page. Gets the daily traffic. Publish first, pin it. |
| Tue | 05 4d-draw-schedule | Supports the hub, answers "next draw" queries. |
| Wed | 03 4d-prize-structure | Highest commercial intent, best first ad slot. |
| Thu | 04 how-to-check-4d-result-online | Tutorial intent, fast to rank. |
| Fri | 08 4d-odds-probability | Snippet bait: "what are 4D odds". |
| Sat | 06 types-of-4d-bets | Comparison intent, monetises well. |
| Sun | 07 4d-winnings-tax-malaysia | YMYL, needs citations — add before publishing. |
| Mon wk2 | 02 4d-results-history | Feeds future archive/programmatic pages. |
| Tue wk2 | 09 most-frequent-4d-numbers | Shareable chart, link magnet. |
| Wed wk2 | 10 is-4d-legal-malaysia | Trust + ad-eligibility signal. |

One post per day. Google treats a drip of 10 posts over 2 weeks as normal. Ten posts on one day looks like a content farm.

## Per-article publishing checklist

1. Paste `article.md` front matter into your SEO plugin (RankMath/Yoast/AIO): title, slug, meta description.
2. Upload the 5 images from `images/` — use **webp**, keep the alt text exactly as written (also in `images-manifest.csv`).
3. Add the hero image as the featured image.
4. Turn on FAQ schema for the FAQ section (RankMath FAQ block or schema plugin).
5. Add the internal links listed in the `PUBLISH NOTES` comment at the bottom of each article — then delete that comment.
6. Add the schema markup: Article + Breadcrumb + FAQPage.
7. Check: no broken images, meta description under 160 chars, H1 matches front matter.

## Ad money playbook — the part that actually matters

**Reality check first.** In this niche, RPM for Malaysian display traffic sits roughly at RM3–15 on Google AdSense, and higher (USD-based) on Mediavine/Raptive-class networks once you clear their traffic thresholds. Volume beats cleverness. A results site earns from sessions, not from articles — so your ad strategy is really a traffic strategy.

**The engine:**
- The daily results page (01) is the asset. Update it every draw day: fresh numbers, date in the H1 or a line above the fold, `dateModified` in schema. Recency is what makes people return — return traffic is what networks reward.
- Build programmatic result-archive pages later (`/4d-result/2026/10/03/` style). Article 02 and 08 are the explainers that support them. This is where 10x page volume comes from.
- Interlink aggressively: hub (01) links out to all nine, all nine link back to the hub.

**Placement rules that earn more per page:**
- One in-article ad after the first image, one mid-content, one before FAQ. Do not stack.
- Keep ads out of the first 300px — both for user experience and because above-the-fold clutter tanks scroll depth.
- Never place ads inside the results table or next to the payout table. People come for the number; get out of the way. Annoyed users bounce, and bounce rate is what kills RPM.
- Enable auto ads only after manual slots perform for 2–4 weeks.

**Speed = money.** Serve images as webp (already exported), lazy-load below the fold, cache aggressively. Every extra second of load time costs impressions, and impressions are the entire revenue model.

## Compliance — read before you monetise

- Google AdSense restricts gambling-related content. Informational results/guide content is a different animal from a betting site, but **expect scrutiny**: no betting links, no casino ads, no "bet now" CTAs anywhere in this pack (there are none). Article 10 exists to make the results-only positioning explicit.
- If AdSense rejects, use niche ad networks or direct local sponsorships — but keep the content clean either way, because the instant you link to bookies you become a gambling site for policy purposes.
- Article 07 (tax) and 10 (legal) are YMYL: add official citations (LHDN, statute references) before publishing. Do not publish legal/tax claims unsourced.
- Include responsible-gambling and 21+ messaging on the site, not just in articles.

## Regenerating images

Edited a title or figure in `data-a.mjs` / `data-b.mjs`?

```
cd 4dmalaya-content
node build-images.mjs
```

Rewrites all 50 images (webp + png + svg) and refreshes `images-manifest.csv`. Alt-text length is checked automatically; keep alt under 125 characters.

## Facts baked into this pack (verify once, then trust)

- Prize structure per RM1: Big 2,500 / 1,000 / 500 / 180 (x10) / 60 (x10); Small 3,500 / 2,000 / 1,000 — matches published operator tables.
- Draws: Wednesday, Saturday, Sunday, ~7:00 PM MYT for Magnum, Sports Toto, Da Ma Cai. Sabah pools vary (commonly Tue/Thu/Sat/Sun).
- Expected return: RM0.64 (Big) / RM0.65 (Small) per RM1 — computed in article 08, arithmetic shown.
- Permutation payout grid in article 06 mirrors the published Sports Toto table.

Re-check these against operator pages at least once a year, and after any prize-structure announcement.
