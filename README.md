
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
| Automatic reconnection | Determines if the app reconnects to archipelago automatically or not. e.g. if the connection to the archipelago server is lost, should connection be retried automatically <br>Default value is on. If you know that you will have a very weak and spotty connection or no connection at all, you should toggle this off. |
| Reconnect attempt amount | Determines how many times the app will try to reconnect to the archipelago server, if connection is lost. If the amount is reached (or is set to 0), the user is told that they have disconnected and be taken back to the connection screen. <br>Defaults to 5. Can't be less than 0. Recommended range: 3 - 10<br><br>Note: This setting is ignored if automatic reconnection is turned off. |
| Keep screen on | Determines if app should keep the screen on.<br>If true, the screen will not turn off if you are connected to an Archipelago server.<br>If false, the screen will not turn off during location generation.<br>Default value is false |
| Play sound effects | Determines if the app should play sounds. Sound effects will play on disconnection and reconnection. Additionally the appropriate sound will play when an item is received. See sound effect [license file](assets/sounds/LICENSE.txt) for more info. Default: true |
| Allow multiple locations on the same road | If enabled, a road can have multiple locations. For example, imagine a road that has three buildings, Building 1, Building 2 and Building 3. If this setting is disabled, only a single location will be on the road, located usually at the middle point of the road. If enabled, all three buildings can be locations separately. <br>Default is off. Should be turned on, if playing in an area with few roads or with many locations to speed up generation.<br><br> Note: The location generation will selectively act like this setting is enabled, if location a single location takes too many attempts.    |
| Location radius | Determines the distance from which a location can be collected (in meters). Because of the variance in locations, you should determine the best value for your area. Allowed values are 10 - 100. Default is 20.     |
| Retry location amount | Determines how many times the app should try generating unique trips before continuing. If set to zero, locations are not checked for uniqueness, causing multiple checks to be in the same location. Should be lower if playing in an area with few roads or with many locations. Default is 5. |
| Ban all rerolled locations | Determines if all rerolled locations should be added to the list of banned locations. If false, you will be asked if you want to ban a location every time you reroll a location. Banning too many locations can have a negative effect on location generation speed. Default is false
| Automatic location sending | If set to false, locations are not checked when they are entered. You must manually press the check button. Turning this off might improve battery life, and removes the need for background location permission. If background permission is not given on first connection, this setting gets set to false. Prompts user to change the background permission setting on toggle. Default: true
| CHEAT: Allow free location sending | Allow checks to be sent with a button. If set to true, a button in the location info popup can be pressed to always send a location. If false, the button checks if you are within the marker radius. Default is false

#### Location settings

Settings related to location placement are located in another screen. It can be accessed by pressing the manage location settings button in the settings screen.


![Screenshot_1751348617](https://github.com/user-attachments/assets/d5f54b8f-680e-457b-8432-3731102092b0)

By pressing the ? button in the top right of the map, a popup can be opened. 

![Screenshot_1750926080](https://github.com/user-attachments/assets/a3218407-8797-4962-98f6-4ad77ae9721d)

In the popup the home location option can be toggled. The home location is used when the locations are intially generated and when they are re-rolled. As stated in the popup, the marker can be moved by long pressing it and dragging.

The two sliders adjust the circles on the map. They are there to help with yaml settings. **They have no effect on location generation. Actual values are determined by the submitted yaml.**

![Screenshot_1751349646](https://github.com/user-attachments/assets/2522a5f6-df50-4ccb-b35f-e7c366111645)
Home marker enabled with the sliders set to the minimum possible values.

Tapping the 'Toggle angle adjuster' button at the top of the screen, a circular slider will appear.

![Screenshot_1750926811](https://github.com/user-attachments/assets/e6bffd68-49ac-45c6-8416-cae3c7f3a373)

This slider adjusts the directions that locations will be generated. The angle is not exact, but does have a big influence on the location angles.

**Example of the setting**

![Screenshot_1750927326](https://github.com/user-attachments/assets/15db3b4c-6bbf-4aa4-bf70-35ae05b4be6b)
![Screenshot_1750927428](https://github.com/user-attachments/assets/70d6bbac-323e-49fb-91de-79521016103c)

Note how a few of the generated locations are slightly outside the allowed angle, but that all of the locations are in the south-west.

If any locations have been added to the banned locations list (done by via rerolling), they will be shown in this screen as well.


![Screenshot_1750932966](https://github.com/user-attachments/assets/a015fc31-9f61-4c8d-a33f-d15f8ee262e2)

By tapping on a banned location, it's OSM ID will be shown. By tapping on the popout, the location can be removed from the list of banned locations.

![Screenshot_1750932956](https://github.com/user-attachments/assets/0c923065-898d-4cef-89ce-bf706f278c6b)

### Connection saving
When a connection is successfully made to an archipelago server, the app asks if you want to save that connection.

![Screenshot_1734939273](https://github.com/user-attachments/assets/40caab98-cd08-4134-9c72-815228512031)


Once a connection is saved, it can be found in the Saved Connections screen. The two buttons can be used to edit a saved connection or to delete it.

![image](https://github.com/user-attachments/assets/8dfa975c-5bc5-4169-9656-00eff2909f74)

The list of generated locations is kept with this information, so if you delete or overwrite it, new locations will be generated on connection.

### Location information

If a location is hinted and it contains either a progression item or an useful item, the marker will be different

![Screenshot_1734939909](https://github.com/user-attachments/assets/04c7f325-548c-4255-864f-d701699ac4c9)

By tapping on a marker, a callout will be shown displaying that location's archipelago name.

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

If keys have been hinted, the hints will be shown. The hint key button will be hidden, if enough keys have been hinted

![image](https://github.com/user-attachments/assets/f10d2161-89fd-4017-8518-1240fe614a47)


The pop up also contains a button than can be used to re-roll the location. This does have a cooldown, currently set to 2 minutes.

If a location is inaccessible, the popup that follows the re-roll can be used to add the location to the list of banned locations.

### AP info popup

By pressing the Ap button while connected, a popup containing your goal information will be shown. Additionally, the amount of keys you have received will be shown as well.

![Screenshot_1751352138](https://github.com/user-attachments/assets/2d2b3f0c-495c-40ad-8df3-42c535cd667c)
![Screenshot_1751352123](https://github.com/user-attachments/assets/20fbe9db-3ff3-49fb-8f2c-3dc50313cd19)
![Screenshot_1751352106](https://github.com/user-attachments/assets/99229e5f-262d-47dc-ba9e-8374b9d4f01c)

## Feature list

### Client
| Feature |Status  |
|--|--|
| Saving and loading connection info | ✔️ |
| Editing saved connections| ✔️ |
| Showing connection / other errors to the user| ✔️ |
| Receiving and sending messages| ✔️ |
| Handling poor connection situations| ❓<sup>1</sup> |
| Showing hinted items, e.g. Text clients hints tab| ✔️ |
| Client commands| ✔️ |
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

### Locations do not appear
The location generation is not perfect. If there are only a few location that satisfy the maximum and minimum distance, it might take a few tries to find a suitable location. Additionally, the app tries to make non duplicate locations. If either of these take too many tries, the location will eventually be accepted.

### Any other issues
Post in the [future-games-design thread](https://discord.com/channels/731205301247803413/1203890996794884126) or open an issue here on github and I'll take a look. If possible, please attach screenshots.
