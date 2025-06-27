import { StyleSheet } from "react-native";

const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  refreshButton: {
    position: "absolute",
    top: 60,
    right: 12,
    zIndex: 1000,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 1,
    elevation: 10,
    opacity: 0.75,
    borderBlockColor: "lightgray",
  },
});

export default mapStyles;
