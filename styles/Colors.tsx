const Colors = false //TODO: Add logic to check light or dark mode
  ? {
      black: "#000000",
      red: "#EE0000",
      green: "#00FF7F", // typically a location
      yellow: "#FAFAD2", // typically other slots/players
      blue: "#6495ED", // typically extra info (such as entrance)
      magenta: "#EE00EE", // typically your slot/player
      cyan: "#00EEEE", // typically regular item
      slateblue: "#6D8BE8", // typically useful item
      plum: "#AF99EF", // typically progression item
      salmon: "#FA8072", // typically trap item
      white: "#FFFFFF", // not used, if you want to change the generic text color change color in Label
    }
  : {
      black: "#000000",
      red: "#EE0000",
      green: "#00D168", // typically a location
      yellow: "#DBDBB8", // typically other slots/players
      blue: "#6495ED", // typically extra info (such as entrance)
      magenta: "#EE00EE", // typically your slot/player
      cyan: "#00BDBD", // typically regular item
      slateblue: "#6D8BE8", // typically useful item
      plum: "#AF99EF", // typically progression item
      salmon: "#FA8072", // typically trap item
      white: "#FFFFFF", // not used, if you want to change the generic text color change color in Label
    };
export default Colors;
