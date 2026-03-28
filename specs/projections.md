# Player Stats

For a specific draft we have different ways to incorporate stats.

1. Subscribe to a service
2. Upload single stats records

For development we will support the 2nd option.

## 1. Subscribe to a service

TBD. Not for development.

## 2. Upload projections

This is our preferred path for development.

In the Admin page, provide an upload stats option. The stats file can use any mix of defined stats in the `StatDefinition` table.

Each upload can be assigned metadata that allows querying its data for different cases. These include:

season: 4 digit year
projected: boolean
neutralized: boolean
split: none | vs Left | vs Right

Where:

- `projected: true` are stats projected for the given season.
- `neutralized: true` are stats adjusted to a neutral context.
- `vs Left` are stats vs LHP (for hitters) or LHH (for pitchers)
- `vs Right` are stats vs RHP (for hitters) or RHH (for pitchers)

Based on this metadata, any single year of stats may have up to 12 variations, though most commonly, projected: true + neutralized: true for the upcoming season is the most common case with actual stats for past season the next most common.

Here is a sample set of column headers from a Fangraphs Steamer Projections export:

**Batters**

Name,Team,G,PA,AB,H,1B,2B,3B,HR,R,RBI,BB,IBB,SO,HBP,SF,SH,GDP,SB,CS,AVG,BB%,K%,BB/K,OBP,SLG,wOBA,OPS,ISO,Spd,BABIP,UBR,wSB,wRC,wRAA,wRC+,BsR,Fld,Off,Def,WAR,ADP,InterSD,InterSK,IntraSD,Vol,Skew,Dim,FPTS,FPTS/G,SPTS,SPTS/G,P10,P20,P30,P40,P50,P60,P70,P80,P90,TT10,TT20,TT30,TT40,TT50,TT60,TT70,TT80,TT90,NameASCII,PlayerId,MLBAMID

Full data file is in sources/steamer-batters-neutral-*.csv

**Pitchers**

Name,Team,W,L,QS,ERA,G,GS,SV,HLD,BS,IP,TBF,H,R,ER,HR,BB,IBB,HBP,SO,K/9,BB/9,K/BB,HR/9,K%,BB%,K-BB%,AVG,WHIP,BABIP,LOB%,GB%,HR/FB,FIP,WAR,RA9-WAR,ADP,InterSD,InterSK,IntraSD,Vol,Skew,Dim,FPTS,FPTS/IP,SPTS,SPTS/IP,P10,P20,P30,P40,P50,P60,P70,P80,P90,TT10,TT20,TT30,TT40,TT50,TT60,TT70,TT80,TT90,NameASCII,PlayerId,MLBAMID

Full data fiile is in sources/steamer-pitchers-neutral-*.csv

Note that other stat sources may have far few columns and we may have to normalized column headers. For now, our `statDefinition` and these CSVs both come from Fangraphs. Required fields for the import are Name and PlayerId _or_ MLBMID. 

## Stats Upload API

On upload, recognized stats should populate a table along with the metadata. The table or table schemas should be designed to join to player IDs in the PLAYERIDMAP via PlayerId as Fangraphs ID. 

Thus, stats will be associated to player via PlayerId, and can be filtered by year, projected or not, neutralized or not, split vs L, vs R, or not.

## Stat Presentation

Fangraphs breaks up stat presentation into several overlapping cases:

**Batters**

Fangraphs Dashboard
#	Name	Team	G	PA	HR	R	RBI	SB	BB%	K%	ISO	BABIP	AVG	OBP	SLG	wOBA	wRC+

Fangraphs Standard
#	Name	Team	G	AB	PA	H	1B	2B	3B	HR	R	RBI	BB	IBB	SO	HBP	SF	SH	SB	CS	AVG

Fangraphs Advanced
#	Name	Team	G	PA	BB%	K%	BB/K	AVG	OBP	SLG	OPS	ISO	Spd	BABIP	UBR	wSB	wRC	wRAA	wOBA	wRC+

**Pitchers**

Fangraphs Dashboard
#	Name	Team	W	L	SV	G	GS	IP	K/9	BB/9	HR/9	BABIP	LOB%	GB%	ERA	FIP	WAR

Fangraphs Standard
#	Name	Team	W	L	ERA	G	GS	SV	HLD	BS	IP	TBF	H	R	ER	HR	BB	IBB	HBP	SO

Fangraphs Advanced
#	Name	Team	K/9	BB/9	K/BB	HR/9	K%	BB%	K-BB%	AVG	WHIP	BABIP	LOB%	FIP

The uploaded file contains all the stats that can populate these presentations. Many of them are unused.

## Open Questions

Should we update the StatDefinition table to indicate use in "Dashboard, Standard, Advanced"?

Should we move StatDefinition to JSON files along with "layout definitions" like "Dashboard, Standard, Advanced"?

For queries and filters is there a better way to retrieve stats per player than the suggested season, projected, neutralized, split proposal?