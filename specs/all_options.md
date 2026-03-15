> **Status: Brainstorm** — Full option surface area exploration. Not yet implemented.

# All Customization Options

## League Settings

- League Name - String
- Number of Teams - Integer
- Make League Viewable to Public - Boolean
- Divisions

## Lineups
- Daily / weekly / other
- Inactive subs
  - Swap: inactive players are swapped to the bench for an available bench player
    - In sequence (auto swap)
    - Pre-set (manual pairing)
  - Bench: inactive players are benched
    - Unless a future lineup has been set, benched players return to their previous lineup position the next day

## Scoring Type

Rotisserie
- Compete against your whole league all season long, trying to rank the highest in each stat category. Rotisserie, or 'Roto', is the most common way to play Fantasy Baseball. In this scoring type, teams are ranked from first to last in each of the league's stat categories. Points are then awarded based on these category rankings and totaled to determine an overall score and league rank.

- Head to Head Points. Face-off with one opponent each week, trying to score more total points. H2H Points allows you to assign a given point value to individual stat categories and each matchup's winner is determined solely by which team accumulates the most fantasy points. The end result is a win (1-0-0), loss (0-1-0) or tie (0-0-1). If selected, your league will have team schedules/playoffs and you will have the option to set up divisions.

- Head to Head Each Category. In head-to-head matchups, teams compete in each of the league's stat categories, earning a win, loss or tie in every one. If selected, your league will have team schedules/playoffs, and you will have the option to set up divisions.

- Head to Head Most Categories. H2H Most Categories allows you to select a number of stat categories. For each matchup (usually Monday through Sunday) team totals are accumulated in each of the categories. At the end of the matchup, the winner is determined by which team wins the greater number of categories. The end result is a win (1-0-0), loss (0-1-0) or tie (0-0-1) for each team. If selected, your league will have team schedules/playoffs, and you will have the option to set up divisions.

- Total Season Points. Points-Based scoring allows you to assign a given point value to each individual stat category. Standings are based on the accumulation of points covering all stat categories and combined into one total points column. The team with the most overall points at the end of the season wins.

- Best Ball.
  - Sometimes a parallel contest (i.e. Ottoneu OPL)
  - Snake or auction draft
  - Generally points
  - No in-season team management, adds and drops, or lineup setting.
  - Automatic scoring based on best scoring of hitting / pitching groups daily, weekly, or other.
  - Generally very large rosters
  - Sometimes with playoff structures

## Draft Type

- Auction / Snake / Autopick
- Sync / Async / Live
  - Sync is default in which all managers are logged into the draft room to bid
  - Async is a slow draft in which managers may have multiple nominations at any time, may bid on any current nominations, managers don't take turns nominating players. Typically long time or bidding with a reset time when the winning bid changes managers
- Start date and time
- Time for each pick
- Other bid mechanics  
  - Optional reset time after a successful bid. Good for slow async drafts.
  - Nominations
  - Max bid
  - Hidden bids
    - Max
    - Vickrey

## Player Universe

- All Major and Minor League Players
- All Players, World Wide
  - Generally means a custom player universe, hand-maintained
- Major league players only
  - Minor leaguer promotions and availability

## Transactions

- Drops
- Trades
  - 1 to 1, many to many
  - Allow draft pick trading
  - Allow loans (salary cap leagues)
    - Limits on loans
- Waivers
  - Waiver period
- Free Agents

## Rosters

Rosters are defined as the players that can fill a roster. Leagues will always have a list of roster slots to fill which can be any of the following:
C
1B
2B
3B
SS
MI -- Middle infielder (2B / SS)
CI -- Corner infielder (1B / 3B)
INF -- Any infielder
OF -- Outfielder at any outfield position
LF
CF
RF
UTIL -- Any player
DH -- Player that can only play DH
SP
RP
P -- Any pitcher

Leagues may specify and min and max for each slot where min represents a "legal" roster.

Leagues will specify how many of each slot are counted for each day.

Some leagues allow players of a certain status to not count against roster size. Likewise these players aren't counted toward max and min settings. These might include IL, IL60, Suspended, Minors

## Limits
- Batters
  - No limts
  - Games played per slot / matchup / season
  - Games started per slot / matchup / season
  - At Bats per slot / matchup / season
  - Plate Apperances per slot / matchup / season
- Pitchers
  - No limits
  - Games played (apperances) per slot / matchup / season
  - Innings pitcher per slot / matchup / season
  - Games started per slot / matchup / season

  ## Special Rules
  - Doubleheaders
  - Soft cap / Hard cap