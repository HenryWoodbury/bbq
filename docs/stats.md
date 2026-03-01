# Player Metadata and Statistics

## Smart Fantasy Baseball Player Universe

To add key player details and constrain the player universe we use the Smart Fantasy Baseball Player ID Map. This will be an infrequent CSV Upload that allows cross-indexing between various services. It provides player name, birth date, handedness info, Baseball-Reference ID, Fangraphs ID, MLB ID, CBS ID, Retrosheet ID, etc..

The Player ID Map provides a natural limit on the number of MLB players that are exposed in searches and paginated tables, with the option to still access "more obscure" players from other imports.

> **Does the Player ID Map Include All MLB Players?**
> No. The tool is intended to be used for fantasy baseball purposes. Accordingly, the goal is to include only “fantasy relevant” players. That’s a purposely vague threshold. In the preseason, I generally keep the top 750ish players accordingly to NFBC ADP included in the Player ID Map.

> An “Active” column was added to the spreadsheet in the fall of 2020. This field has values of “Y” for active players and “N” for inactive players. 

The updated player ID map data can be retrieved with this import statement (Google Sheets):

```
=importdata("https://www.smartfantasybaseball.com/PLAYERIDMAPCSV")
```

Could a curl command work?

```
curl -L "https://www.smartfantasybaseball.com/PLAYERIDMAPCSV" 
```

Could a fetch work from the application?

```
await fetch("https://www.smartfantasybaseball.com/PLAYERIDMAPCSV")
```

## Statistics

For historical stats I can upload the Batting, and Pitching files from the Lahman database and cross-index to BBref or Retrosheet ID.

For minor league stats, the Lahman database won't work, so I will need another option.

For projections, I plan to use a download from Fangraphs once projections are available. I will have check licensing for that approach and in production can probably license specific projections rather than do the file upload.

