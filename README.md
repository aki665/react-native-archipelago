
# Archipela-Go!

  

## Features of the app

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
| Progressive Key| ✔️ |
| Macguffins | ✔️ <sup>4</sup>|
| Distance Reductions| ❌ |
| Scouting Distance| ❌ |
| Traps| ❌ |

<sub>4. Both short and long macguffin hunts</sub> 

## How to run

1. Install [Node.Js](https://nodejs.org/en)

2. Install Expo Go on [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) or [iOS](https://apps.apple.com/us/app/expo-go/id982107779)

3. Run the command `corepack enable` as admin

4. Clone the repository and run the command `yarn` in the project root

5. Run the command `yarn start` in the project root and scan the QR code with the app.
