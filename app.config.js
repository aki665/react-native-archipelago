module.exports = {
  ios: {
    config: {
      googleMapsApiKey: process.env.EXPO_GOOGLE_API_KEY,
    },
  },
  android: {
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_GOOGLE_API_KEY,
      },
    },
  },
};
