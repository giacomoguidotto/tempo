// Version injected by CI or defaults to 0.1.0
const version = process.env.APP_VERSION ?? "0.1.0";
const [major = 0, minor = 0, patch = 0] = version.split(".").map(Number);
const versionCode = major * 10_000 + minor * 100 + patch;

export default {
  expo: {
    name: "Tempo",
    slug: "tempo",
    version,
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "tempo",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain" as const,
      backgroundColor: "#1A1714",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1A1714",
      },
      package: "dev.guidotto.tempo",
      versionCode,
      permissions: [
        "SCHEDULE_EXACT_ALARM",
        "POST_NOTIFICATIONS",
        "FOREGROUND_SERVICE",
        "WAKE_LOCK",
        "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
        "USE_FULL_SCREEN_INTENT",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED",
      ],
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-sqlite",
      "./plugins/with-notifee",
      "./plugins/with-alarm-activity",
    ],
    extra: {
      router: {},
      eas: {
        projectId: "c56191c8-5720-474e-ab1b-d8ed99e47549",
      },
    },
  },
};
