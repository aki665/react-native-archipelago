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
    top: 10,
    left: 10,
    zIndex: 9999,
    backgroundColor: "white",
    padding: 5,
    borderRadius: 1,
    elevation: 10,
    opacity: 0.75,
  },
});

export default mapStyles;
