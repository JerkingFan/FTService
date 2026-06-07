/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const demoMode =
    process.env.EXPO_PUBLIC_DEMO_MODE === "true"
      ? true
      : process.env.EXPO_PUBLIC_DEMO_MODE === "false"
        ? false
        : config.extra?.demoMode !== false;
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    config.extra?.apiUrl ||
    "http://213.155.9.130/api";

  return {
    ...config,
    extra: {
      ...config.extra,
      demoMode,
      apiUrl,
    },
  };
};
