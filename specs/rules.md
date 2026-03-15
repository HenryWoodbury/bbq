> **Status: Design spec** — Comprehensive non-draft rule definitions. Most are not yet implemented in the application.

# League Rules (Non-Draft)

This file captures **non-draft league rules** that can apply to different drafts and formats.

Use this when:
- Defining how a league actually plays once teams are drafted.
- Creating reusable rule-sets that multiple drafts or seasons can reference.

Everything here was moved from `options.md` so that `options.md` can focus on **draft configuration**.

---

## 1. League Meta

- **leagueId**: UUID/string (internal)
- **leagueName**: string
- **leagueDescription**: text
- **externalHost**: string
- **externalID**: string
- **externalURL**: string
- **leaguePublicVisibility**: enum
  - `public`
  - `unlisted`
  - `private`
- **leaguePasswordOrInvitePolicy**: enum
  - `open`
  - `password`
  - `invite_only`
- **seasonYear**: integer
- **multiYearLeagueType**: enum
  - `redraft`
  - `keeper`
  - `dynasty`
  - `contract`

---

## 2. Teams & Divisions

- **teamCount**: integer
- **allowedTeamCountRange**: min/max integers
- **divisionCount**: integer (0 = no divisions)
- **divisionsBalanced**: boolean
- **divisionAssignmentMode**: enum
  - `manual`
  - `random`
- **expansionContractionAllowed**: boolean
- **maxTeamsPerOwner**: integer

---

## 3. Schedule & Matchups

- **scoringType**: enum
  - `roto`
  - `h2h_points`
  - `h2h_each_category`
  - `h2h_most_categories`
  - `total_points_season`
- **scheduleModel**: enum
  - `balanced`
  - `divisional_weighted`
  - `custom`
- **matchupLengthType**: enum
  - `weekly`
  - `periodic`
  - `daily`
- **matchupLengthDays**: integer
- **doubleHeadersCountAsSeparateMatchups**: boolean
- **regularSeasonWeeks**: integer (0/undefined = derive from schedule)
- **allPlayWeeksEnabled**: boolean
- **byeWeeksAllowed**: boolean

### 3.1 Tiebreakers

- **matchupTiebreakerPolicy**: enum
  - `allow_ties`
  - `no_ties_high_seed_advances`
  - `no_ties_home_team_advances`
  - `no_ties_custom_metric`
- **matchupTiebreakerMetric**: enum
  - `total_points_bench_included`
  - `best_category`
  - `era_whip_combo`
  - `custom_formula`
- **standingsTiebreakerOrder**: ordered list of:
  - `head_to_head_record`
  - `total_points`
  - `category_wins`
  - `category_win_percentage`
  - `run_differential`
  - `coin_flip_random`

---

## 4. Playoffs

- **playoffsEnabled**: boolean
- **playoffTeamsCount**: integer
- **playoffStructureType**: enum
  - `single_elimination`
  - `double_elimination`
  - `round_robin`
  - `custom`
- **playoffRoundLengthWeeks**: integer or array
- **playoffSeedingStrategy**: enum
  - `by_regular_season_record`
  - `by_total_points`
  - `by_category_wins`
- **playoffReseedingEachRound**: boolean
- **thirdPlaceGameEnabled**: boolean
- **consolationBracketEnabled**: boolean
- **consolationRewardsType**: enum
  - `none`
  - `better_draft_position`
  - `fab_bonus`
  - `other_prize`

---

## 5. Player Universe & Eligibility

- **playerUniverseType**: enum
  - `mlb_only`
  - `mlb_and_milb`
  - `global_custom_list`
- **playerDataSource**: enum
  - `mlb_official`
  - `fangraphs`
  - `other_vendor`
- **positionEligibilitySource**: enum
  - `stats_provider_default`
  - `custom`
- **positionEligibilityThresholdGamesCurrentSeason**: integer
- **positionEligibilityThresholdGamesPreviousSeason**: integer
- **positionEligibilitySeparateHitterPitcherThresholds**: boolean
- **allowTwoWayPlayersAsBothHitterAndPitcherSimultaneously**: boolean
- **maxPlayersPerRealTeam**: integer
- **leagueScope**: enum
  - `mixed`
  - `al_only`
  - `nl_only`

---

## 6. Roster Structure

- **rosterSizeTotalMax**: integer
- **rosterSizeTotalMin**: integer

### 6.1 Roster Slots

- **rosterSlots**: array of
  - `slotId`: string (e.g. `C`, `1B`, `OF`, `SP`, `P`, `UTIL`, `IL`, `MINORS`, `NA`)
  - `displayName`: string
  - `eligiblePositions`: array of positions (e.g. `["C"]`, `["1B","3B"]`, `["SP","RP"]`)
  - `minCount`: integer
  - `maxCount`: integer
  - `activeCountPerScoringPeriod`: integer
  - `countsAgainstRosterLimit`: boolean
  - `statusRestriction`: enum or array (e.g. `il_only`, `minors_only`, `suspended_only`, `none`)

### 6.2 Special Status Slots

- **injuredListSlotsCount**: integer
- **injuredListRequiresOfficialIL**: boolean
- **longTermILSlotCount**: integer
- **minorsSlotsCount**: integer
- **minorsEligibilitySource**: enum
  - `official_prospect_status`
  - `service_time_threshold`
  - `games_played_threshold`
- **naSlotsCount**: integer

---

## 7. Lineups & Daily Behavior

- **lineupChangeFrequency**: enum
  - `daily`
  - `weekly`
  - `periodic`
- **lineupLockPolicy**: enum
  - `at_first_game_of_period`
  - `per_player_game_time`
  - `per_team_first_game_each_day`
- **allowRetroactiveLineupChangesForPostponedGames**: boolean
- **inactivePlayerHandling**: enum
  - `stay_in_lineup`
  - `auto_swap_if_replacement_available`
  - `auto_bench`
- **inactiveSwapMode**: enum
  - `in_sequence_auto`
  - `preset_pairings_manual`
- **doubleheaderLineupRules** object:
  - `doubleheadersCountAsSeparateGames`: boolean
  - `allowConditionalBenchForSecondGame`: boolean

---

## 8. Scoring & Limits

### 8.1 Categories

- **scoringCategoriesBatters**: array of enums (snake_case)
  - examples: `r`, `rbi`, `hr`, `sb`, `avg`, `obp`, `slg`, `ops`, `bb`, `hbp`, `tb`, `k`, `cs`, `gidp`
- **scoringCategoriesPitchers**: array of enums (snake_case)
  - examples: `w`, `l`, `sv`, `hld`, `k`, `era`, `whip`, `k_per_9`, `hr_per_9`, `qs`
- **categoryScoringMode**: enum
  - `5x5`
  - `4x4`
  - `nxn_custom`

### 8.2 Roto

- **rotoPointAllocationMode**: enum
  - `standard`
  - `reverse`
  - `custom_scale`

### 8.3 Points

- **pointsFormulaEnabled**: boolean
- **pointsWeightsBatters**: map of stat -> weight
- **pointsWeightsPitchers**: map of stat -> weight
- **negativeStatsEnabled**: boolean
- **separatePointsForSPandRP**: boolean

### 8.4 Limits

- **batterLimitsType**: enum
  - `none`
  - `games_played`
  - `games_started`
  - `at_bats`
  - `plate_appearances`
- **batterLimitScope**: enum
  - `per_matchup`
  - `per_season`
- **batterLimitValue**: integer

- **pitcherLimitsType**: enum
  - `none`
  - `innings_pitched`
  - `games_started`
  - `appearances`
- **pitcherLimitScope**: enum
  - `per_matchup`
  - `per_season`
- **pitcherLimitValue**: integer

- **minimumInningsPitchedPerPeriod**: integer
- **minimumInningsPitchedPenaltyType**: enum
  - `none`
  - `auto_loss_for_era_whip`
  - `negative_points`
  - `zero_points_for_pitching_categories`

- **prorateLimitsForShortWeeks**: boolean

---

## 9. Transactions, Trades, Contracts, Governance

These are non-draft operational rules for after the draft.

### 9.1 Transactions (Waivers, FAAB, Free Agents)

- **maxAddDropsPerWeek**: integer
- **maxAddDropsPerSeason**: integer
- **maxTradesPerSeason**: integer
- **transactionLockOnceEliminated**: boolean

- **waiverEnabled**: boolean
- **waiverType**: enum
  - `rolling_priority`
  - `reverse_standings_reset_periodic`
  - `fab_budget`
  - `none_first_come_first_served`
- **waiverPeriodAfterDropDays**: integer
- **waiverClearTimeOfDay**: time
- **waiverPriorityInitialOrder**: enum
  - `reverse_draft_order`
  - `random`
  - `by_standings`
- **waiverPriorityResetFrequency**: enum
  - `never`
  - `daily`
  - `weekly`
  - `monthly`
  - `by_period`

- **fabEnabled**: boolean
- **fabBudgetPerTeam**: integer
- **fabSeasonalReplenishment**: enum
  - `none`
  - `fixed_amount_each_season`
  - `percentage_of_unused_carryover`
- **fabAllowZeroDollarBids**: boolean
- **fabBidVisibility**: enum
  - `private`
  - `public_after_processing`
- **fabTieBreaker**: enum
  - `waiver_priority`
  - `reverse_standings`
  - `time_of_bid`
- **fabProcessingSchedule**: enum
  - `daily`
  - `weekly`
  - `specific_days`

- **freeAgentAcquisitionMode**: enum
  - `immediate`
  - `overnight_batch`
  - `fab_only`
- **freeAgentAcquisitionWindow**:
  - `startTime`: time
  - `endTime`: time
- **recentlyDroppedPlayerRestrictionDays**: integer
- **allowPreselectCutsForIllegalRostersOnAdd**: boolean
- **allowGracePeriodToFixIllegalRostersAfterAdd**: boolean

### 9.2 Trades

- **tradingEnabled**: boolean
- **tradeTypesAllowed**: array of enums
  - `player_for_player`
  - `player_for_picks`
  - `player_for_fab`
  - `salary_loans`
- **loanLimitsEnabled**: boolean
- **maxSalaryLoanPercentage**: number
- **tradeReviewType**: enum
  - `commissioner_only`
  - `league_vote`
  - `auto_approve`
- **tradeReviewPeriodHours**: integer
- **leagueVoteVetoThresholdPercent**: integer
- **tradeDeadlineDateTime**: datetime
- **postDeadlineTradeTypesAllowed**: array

### 9.3 Contracts & Caps

- **salaryCapEnabled**: boolean
- **salaryCapAmount**: integer
- **salaryFloorEnabled**: boolean
- **salaryFloorAmount**: integer
- **contractModel**: enum
  - `none`
  - `auction_price_as_salary`
  - `fixed_tiers`
  - `custom_contracts`
- **annualSalaryInflationType**: enum
  - `none`
  - `flat_amount`
  - `percentage`
- **annualSalaryInflationValue**: number
- **maxContractYears**: integer
- **deadMoneyRules**:
  - `deadMoneyOnCutPercentageRemaining`: number
  - `deadMoneyDurationYearsMax`: integer
- **amnestyCutsPerSeason**: integer

- **arbitrationEnabled**: boolean
- **arbitrationBudgetPerTeam**: integer
- **arbitrationAllocationCapPerPlayer**: integer
- **arbitrationDeadlineDateTime**: datetime

### 9.4 Keeper / Dynasty

- **keeperEnabled**: boolean
- **keeperMaxPerTeam**: integer
- **keeperCostModel**: enum
  - `round_penalty`
  - `salary_increase`
  - `fixed_cost`
  - `no_cost`
- **keeperCostIncreasePerYear**:
  - `rounds`: integer
  - `salary`: integer or percentage
- **keeperMaxYearsPerPlayer**: integer
- **keeperDeclarationDeadlineDateTime**: datetime
- **keeperTiedToOriginalDraftRound**: boolean
- **keeperRightsTransferOnTrade**: boolean

### 9.5 Anti-Tanking & Governance

- **draftLotteryEnabled**: boolean
- **draftLotteryAppliesToTopPicksCount**: integer
- **draftLotteryOddsByPosition**: map
- **consolationTournamentAffectsDraftOrder**: boolean
- **minimumActiveLineupRequirementEnabled**: boolean
- **minimumActiveLineupViolationsConsequences**: enum
  - `warning_only`
  - `fab_penalty`
  - `pick_penalty`
  - `commissioner_discretion`

- **ruleChangeEffectiveSeason**: enum
  - `current_season_immediate`
  - `next_season`
- **ruleChangeVotingEnabled**: boolean
- **ruleChangeApprovalThresholdPercent**: integer
- **commissionerPowers**: array of enums
  - `edit_rosters`
  - `reverse_trades`
  - `retroactively_edit_results`
  - `pause_league`
- **ownerReplacementPolicy**: enum
  - `commissioner_assigns`
  - `open_signups`
- **inactiveOwnerTimeoutDays**: integer

