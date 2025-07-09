import { createAudioPlayer } from "expo-audio";
import { findSetting } from "../components/SettingsContext";

type audio =
  | "disconnected"
  | "reconnected"
  | "filler"
  | "prog"
  | "trap"
  | "useful"
  | "progUseful";

function getSource(audio: audio) {
  switch (audio) {
    case "disconnected":
      return require("../assets/sounds/disconnected.mp3");
    case "reconnected":
      return require("../assets/sounds/connected.mp3");
    case "filler":
      return require("../assets/sounds/Filler.mp3");
    case "prog":
      return require("../assets/sounds/Progression.mp3");
    case "useful":
      return require("../assets/sounds/Useful.mp3");
    case "trap":
      return require("../assets/sounds/Trap.mp3");
    case "progUseful":
      return require("../assets/sounds/ProgUseful.mp3");
  }
}

export default async function playAudio(audio: audio) {
  const playAudio = await findSetting("PLAY_AUDIO");
  if (playAudio) {
    const source = getSource(audio);
    const player = createAudioPlayer(source);
    player.play();
    player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish && status.currentTime >= status.duration) {
        player.release();
        player.removeAllListeners("playbackStatusUpdate");
      }
    });
  }
}
