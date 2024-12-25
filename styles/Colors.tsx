const Colors = false //TODO: Add logic to check light or dark mode
  ? {
      black: "#000000",
      red: "#EE0000",
      green: "#00FF7F", // typically a location
      playerOther: "#FAFAD2", // typically other slots/players
      blue: "#6495ED", // typically extra info (such as entrance)
      playerSelf: "#EE00EE", // typically your slot/player
      filler: "#00EEEE", // typically regular item
      useful: "#6D8BE8", // typically useful item
      progression: "#AF99EF", // typically progression item
      trap: "#FA8072", // typically trap item
      white: "#FFFFFF", // not used, if you want to change the generic text color change color in Label
      progUseful: "#FFDF00",
      progTrap: "#FFAC1C",
      usefulTrap: " #9B59B6",
      progUsefulTrap: "#80FF80",
    }
  : {
      black: "#000000",
      red: "#EE0000",
      green: "#00D168", // typically a location
      playerOther: "#b8860b", // typically other slots/players
      blue: "#6495ED", // typically extra info (such as entrance)
      playerSelf: "#EE00EE", // typically your slot/player
      filler: "#00BDBD", // typically regular item
      useful: "#6D8BE8", // typically useful item
      progression: "#AF99EF", // typically progression item
      trap: "#FA8072", // typically trap item
      white: "#FFFFFF", // not used, if you want to change the generic text color change color in Label
      progUseful: "#dfca37",
      progTrap: "#FFAC1C",
      usefulTrap: " #9B59B6",
      progUsefulTrap: "#80FF80",
    };
export default Colors;
