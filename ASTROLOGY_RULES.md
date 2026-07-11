# Human OS Astrology Rules V0.2

This file records the deterministic conventions used by `app/api/astrology/route.ts`.
It is part of the API contract: changing one of these rules should increment the AST version.

## Astronomy

- Sidereal zodiac using Swiss Ephemeris Lahiri ayanamsha.
- Whole Sign houses from the sidereal ascendant.
- Mean node for Rahu; Ketu is the exact opposite point.

Swiss Ephemeris reference:
https://www.astro.com/swisseph/swephprg.htm

## Planet State

- Retrograde means the Swiss Ephemeris longitude speed is negative.
- Combustion uses angular distance from the Sun and the BPHS direct/retrograde limits:
  Moon 12, Mars 17/8, Mercury 14/12, Jupiter 11/11, Venus 10/8, Saturn 16/16 degrees.
- Rahu and Ketu are never marked combust.
- Balaadi Avastha divides each sign into five six-degree stages. The order is forward in
  odd signs and reversed in even signs.

BPHS English translation used for the combustion table:
https://www.horasad.com/download/ebooks/BRIHAT_PARASHARA_HORA_SHASTRA_1.pdf

## Functional Nature

The `house_lordship_v0` classifier is intentionally simple and auditable:

- A planet ruling both a non-ascendant kendra (4, 7, 10) and a trikona (5, 9) is Yogakaraka.
- Rulers of 1, 5, or 9 are benefic.
- Rulers of 3, 6, or 11 are malefic.
- A planet meeting both groups is mixed.
- Remaining planets are neutral.
- Nodes are neutral because their dispositors and associations are not evaluated in V0.

This is a functional-lordship summary, not a complete strength or outcome judgment.
Reference overview of BPHS chapter 36:
https://www.wisdomlib.org/hinduism/book/brihat-parashara-hora-shastra/d/doc234210.html

## Neecha Bhanga

V0 reports cancellation only for a debilitated planet when either of these planets is in a
kendra from the Ascendant or Moon:

- Lord of the planet's debilitation sign.
- Lord of the sign where that planet is exalted.

Every matched condition is returned in `neechaBhangaConditions`. Other accepted cancellation
conditions are deliberately deferred rather than silently mixed into V0.

## Simplified Strength

`dignity_state_v0` is not Shadbala. It is an interpreter convenience score:

- Exalted +2.
- Moolatrikona or own sign +1.
- Friendly sign +1.
- Enemy sign -1.
- Debilitated -2.
- Combust -1.
- Neecha Bhanga +1.

Positive is `strong`, zero is `medium`, and negative is `weak`. The score and all contributing
factors are returned so the result can be audited.

## Curated Yogas

`curated_v1` evaluates every supported yoga and returns `present`, `evidence`, and
`failedConditions`. It currently covers:

- Dharma Karmadhipati Yoga: 9th and 10th lords are the same planet, share a Whole Sign house,
  exchange the 9th and 10th houses, or mutually aspect each other by Graha Drishti.
- Budha-Aditya Yoga: Sun and Mercury share a Whole Sign house.
- Gajakesari Yoga: the stricter BPHS formation requiring Jupiter in a kendra from Ascendant or
  Moon, benefic conjunction/aspect, and no debilitation, combustion, or enemy sign.
- Sunapha, Anapha, Durudhara, and Kemadruma lunar yogas.
- Vesi, Vosi, and Ubhayachari solar yogas.
- Ruchaka, Bhadra, Hamsa, Malavya, and Sasa Mahapurusha yogas.
- Neecha Bhanga: at least one V0 cancellation condition is met.

These identify base formations. Full classical exception, affliction, and strength analysis is
not claimed. Shadbala, divisional charts, Ashtakavarga, and broader yoga catalogues remain out of
scope.

BPHS yoga chapters and Phaladeepika lunar-yoga reference:

- https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf
- https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621578.html

## Planet Relationship Graph

`planetRelationships` combines only deterministic chart facts: Graha Drishti, sign dispositorship,
close Whole Sign conjunction, opposition, and functional nature. Labels such as `mutual_support`
are produced by `relationship_graph_v1`; the underlying signals are always returned.

## House Strength

`house_strength_v0` is an interpreter convenience model, not Bhava Bala. It combines:

- The house lord's `dignity_state_v0` score.
- Lord placement in kendra/trikona or dusthana.
- Functional nature of occupants.
- Functional nature of planets casting Graha Drishti on the house, including empty houses.

Scores of 2 or more are `strong`; -2 or less are `weak`; the rest are `medium`. Every adjustment
is returned in `drivers`.

## Dominance

`dominance_v1` ranks the seven classical planets. It combines twice the simplified planet-strength
score with angular placement, Ascendant lordship, functional nature, and cluster bonuses. Nodes are
excluded because their V0 dignity and functional-nature models are intentionally neutral.

## Birth Quality

Time accuracy is supplied by the caller as `exact`, `approximate`, or `unknown`; it is never inferred
from a formatted time. Approximate uncertainty up to 10 minutes is high house confidence, up to 30
minutes is medium, and larger or unknown uncertainty is low.

## Auditability

The top-level `audit` section names every scoring model and records correspondence signals for
planet strength, house strength, dominance, and each yoga evaluation.
