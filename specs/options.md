> **Status: Design spec** — Draft configuration option definitions. Most are not yet implemented in the application.

# Draft Configuration Options

This file now focuses **only on draft-related configuration**.

All **non-draft league rules** (scoring, rosters, schedule, waivers, trades, contracts, etc.) live in `rules.md`.

Individual draft templates in `formats.md` should be expressible as specific choices within these options.

---

## 1. Draft Settings

- **draftType**: enum
  - `auction`
  - `snake`
  - `straight`
  - `third_round_reversal`
  - `autopick`
- **draftMode**: enum
  - `live_sync`
  - `slow_async`
- **draftStartDateTime**: datetime
- **draftPickTimerSeconds**: integer
- **slowDraftNominationLimitPerTeam**: integer (0 = unlimited)
- **draftOrderDetermination**: enum
  - `random`
  - `reverse_last_season_standings`
  - `lottery`
  - `commissioner_set`
- **lotterySettings**:
  - `lotteryEnabled`: boolean
  - `lotteryOddsByStandings`: optional map
- **draftPickTradingAllowed**: boolean
- **draftPickTradingYearsInAdvanceMax**: integer

### 1.1 Auction Settings

- **auctionBudgetPerTeam**: integer
- **maxBidPerTeam**: integer (<= budget or dynamic)
- **auctionBidVisibility**: enum
  - `public_incremental`
  - `sealed_vickrey`
  - `sealed_max`
- **auctionBidResetTimeSeconds**: integer (for async)
- **auctionMaxConcurrentNominationsPerTeam**: integer

