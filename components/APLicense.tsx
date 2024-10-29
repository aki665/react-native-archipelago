import { FontAwesome } from "@expo/vector-icons"; // Version can be specified in package.json
import React, { ReactNode } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Linking,
  Image,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";

const LicenseItem = ({
  logoLink,
  logo,
  MainTextLink,
  mainText,
  subTextLink,
  subText,
}: {
  logoLink?: string;
  logo?: ImageSourcePropType;
  MainTextLink?: string;
  mainText?: string;
  subTextLink?: string;
  subText?: string;
}) => {
  return (
    <View style={styles.cardShadow}>
      <View style={styles.card}>
        {logo && (
          <TouchableOpacity
            onPress={() => (logoLink ? Linking.openURL(logoLink) : null)}
          >
            <Image source={logo} style={styles.image} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => (MainTextLink ? Linking.openURL(MainTextLink) : null)}
          style={styles.item}
        >
          <View style={{ maxWidth: "90%" }}>
            <Text style={styles.name}>{mainText}</Text>
            <Link style={styles.text} url={subTextLink ?? ""}>
              {subText}
            </Link>
          </View>
          <FontAwesome
            style={{ alignSelf: "center" }}
            color="#34495e"
            size={16}
            name="chevron-right"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function APLicense() {
  return (
    <View>
      <LicenseItem
        logoLink="https://github.com/ArchipelagoMW/Archipelago"
        logo={require("../assets/color-icon.png")}
        MainTextLink="http://creativecommons.org/licenses/by-nc/4.0/"
        mainText="The Archipelago logo © 2022 by Krista Corkos and Christopher Wilson"
        subTextLink="http://creativecommons.org/licenses/by-nc/4.0/"
        subText="Attribution-NonCommercial 4.0 International"
      />
    </View>
  );
}

const Link = ({
  url,
  style,
  children,
}: {
  url: string;
  style: object;
  children?: ReactNode | ReactNode[];
}) => (
  <Text
    style={style}
    numberOfLines={1}
    onPress={() => url && Linking.openURL(url)}
  >
    {children}
  </Text>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 4,
    maxHeight: 150,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "white",
    alignItems: "stretch",
  },
  cardShadow: {
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: "black",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 2,
  },
  item: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    flex: 1,
    justifyContent: "space-between",
    flexDirection: "row",
    backgroundColor: "transparent",
    maxWidth: "100%",
    flexWrap: "wrap",
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  image: {
    width: 96,
    maxWidth: 96,
    maxHeight: 96,
    flex: 1,
    borderRadius: 0,
    resizeMode: "contain",
    marginTop: 8,
  },

  text: {
    color: "#34495e",
    marginTop: 3,
  },
});
