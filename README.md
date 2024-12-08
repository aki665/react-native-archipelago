
## How to play
1. Download the apworld
	- Be sure to download the yaml from the release page, as not all the options in the apworld are implemented
2. Generate a game and host
3. Download and install the app (.apk only for now, Google Play soon, iOS later)
4. Open the app and connect using your connection info
	- The initial connection message from the server does not show up in the chat. If you see the chat screen, you are connected!
5. Wait for the app to generate locations and start playing

## Notable features

### Settings
Settings can be found and changed in the settings screen (duh). Pressing the ? icon next to the settings name will give a short description of the setting. Bellow is a list of the settings with a longer description.
| Name | Description |
|--|--|
| Connection timeout | Determines how often connection status is checked (in seconds). e.g. if the connection to the archipelago server is lost, it can take **at most** this long for the app to notice. <br>Default value is 120 (2 minutes). Can't be less than 0. Recommended range: 10 - 300 (5 minutes) |
| Reconnect attempt amount | Determines how many times the app will try to reconnect to the archipelago server, if connection is lost. If the amount is reached (or is set to 0), the user is told that they have disconnected and be taken back to the connection screen. <br>Defaults to 5. Can't be less than 0. Recommended range: 3 - 10 |
| Allow multiple locations on the same road | If enabled, a road can have multiple locations. For example, imagine a road that has three buildings, Building 1, Building 2 and Building 3. If this setting is disabled, only a single location will be on the road, located usually at the middle point of the road. If enabled, all three buildings can be locations separately. <br>Default is false. Should be turned on, if playing in an area with few roads or with many locations to speed up generation.<br><br> Note: The location generation will selectively act like this setting is enabled, if location a single location takes too many attempts.    |
| Location radius | Determines the distance from which a location can be collected (in meters). Because of the variance in locations, you should determine the best value for your area. Allowed values are 10 - 100. Default is 20.     |



### Connection saving
When a connection is successfully made to an archipelago server, the app asks if you want to save that connection.
![image](https://github.com/user-attachments/assets/7145d75f-ec41-4e5e-9aec-2df8a57ec0ea)


Once a connection is saved, it can be found in the Saved Connections screen. The two buttons can be used to edit a saved connection or to delete it.

![image](https://github.com/user-attachments/assets/8dfa975c-5bc5-4169-9656-00eff2909f74)

The list of generated locations is kept with this information, so if you delete or overwrite it, new locations will be generated on connection.

If you decide to not save the connection, no info for the slot will be save locally. Automatic reconnection will still function.

### Location information
By tapping on an archipelago marker, a callout will be shown displaying that markers archipelago name.

![image](https://github.com/user-attachments/assets/85c73182-8f2b-4209-8ba0-f0de7e793c59)

If this callout is pressed a pop up will open.

![image](https://github.com/user-attachments/assets/d60ab09d-5655-4fca-90cd-05041970d5de)

If the location is hinted, the hint information will be shown

![image](https://github.com/user-attachments/assets/f811ba90-1eec-40a0-9105-90956dc1c10e)


If not, hint information will be shown, along with a hint button if enough hint points are available.

![image](https://github.com/user-attachments/assets/33c55c4b-50e6-4fce-861d-4138d7cf14c3)

If the location is locked, displayed with a greyed out icon, the pop up will show similar hint information for a key

![image](https://github.com/user-attachments/assets/7b95fb42-6919-4f17-8892-b386018faa9a)

![image](https://github.com/user-attachments/assets/5eb0ac17-14ce-4954-ae42-06160b2d1195) 

![image](https://github.com/user-attachments/assets/0776165c-5b58-4514-9257-2aa9f59732a6)

The pop up also contains a button than can be used to re-roll the location. This does have a cooldown, currently set to 2 minutes.

If a location is inaccessible, see [A location is in an inaccessible area](#a-location-is-in-an-inaccessible-area)

## Feature list

### Client
| Feature |Status  |
|--|--|
| Saving and loading connection info | ✔️ |
| Editing saved connections| ✔️ |
| Showing connection / other errors to the user| ✔️ |
| Receiving and sending messages| ✔️ |
| Handling poor connection situations| ❓<sup>1</sup> |
| Showing hinted items, e.g. Text clients hints tab| ❌ |
<sub>1. The app has not been tested in low connectivity situations </sub> 

### Game
| Feature |Status  |
|--|--|
| Generating random coordinates| ✔️ |
| Making sure said coordinates are reachable| ❓<sup>2</sup> |
| Saving generated coordinates, so they stay the save between sessions| ✔️ |
| Ability to replace generated coordinates| ✔️ |
| Checking locations and sending them to the server| ✔️ |
| Receiving items from the server| ✔️ |
| Handling items received while not connected| ✔️ |
| Not allowing the player to send a location, if it is locked| ✔️|
| Showing checkable locations differently from uncheckable locations| ✔️ |
| Handling goal| ✔️/❌<sup>3</sup> |
| Prompting the player to release and/or collect on reaching goal| ✔️ |
| Saving starting location and making the player return there between trips| ❌ |
| Scouting nearby locations| ❌ |
<sub>2. Works in theory, but has not been tested extensively</sub> 
<sub>3. `One Hard Travel`goal has not yet been implemented</sub> 
  
### Items
| Item|Status  |
|--|--|
| Progressive Key| ✔️ <sup>4</sup>|
| Macguffins | ✔️ |
| Distance Reductions| ❌ |
| Scouting Distance| ❌ |
| Traps| ❌<sup>5</sup> |
<sub>4. Both short and long macguffin hunts</sub> 
<sub>5. Traps do nothing functionality, but the player is notified when they are received</sub> 

## Troubleshooting
### A location is in an inaccessible area
If a generated location is inaccessible for some reason, e.g. forbidden area or not walkable, it can be re-rolled from the location info pop up. Before doing this, please make note of the place ID displayed in the pop up. This is the Open Street Map ID of that location. This ID can be used to get the info of that location and may help in preventing some inaccessible locations in the future. 

If you are comfortable with sharing this ID, **which can be used to find the location on a map**, please send it me over discord directly (@aki665) or in the [future-games-design thread](https://discord.com/channels/731205301247803413/1203890996794884126)

If you are not comfortable with sharing info that may reveal your location, you can still help. By going to https://nominatim.openstreetmap.org/ui/details.html and putting the id there, you can find the information I'm looking for by yourself. I'm mainly interested in the type and extra tags fields, as those seem to hold the most relevant information for exclusion. Please send this information to me over discord directly (@aki665) or in the [future-games-design thread](https://discord.com/channels/731205301247803413/1203890996794884126)

### Locations do not appear
The location generation is not perfect. If there are only a few location that satisfy the maximum and minimum distance, it might take a few tries to find a suitable location. Additionally, the app tries to make non duplicate locations. If either of these take too many tries, the location will eventually be accepted.

### Any other issues
Post in the [future-games-design thread](https://discord.com/channels/731205301247803413/1203890996794884126) or open an issue here on github and I'll take a look. If possible, please attach screenshots.
