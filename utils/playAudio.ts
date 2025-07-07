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
      return require("../assets/sounds/disconnected.wav");
    case "reconnected":
      return require("../assets/sounds/connected.wav");
    case "filler":
      return require("../assets/sounds/Filler.wav");
    case "prog":
      return require("../assets/sounds/Progression.wav");
    case "useful":
      return require("../assets/sounds/Useful.wav");
    case "trap":
      return require("../assets/sounds/Trap.wav");
    case "progUseful":
      return require("../assets/sounds/ProgUseful.wav");
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
