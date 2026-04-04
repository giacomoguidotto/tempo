const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Adds showWhenLocked and turnScreenOn to the main activity
 * so full-screen alarm intents display over the lock screen.
 */
module.exports = function withAlarmActivity(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const mainApp = manifest.manifest.application?.[0];
    if (!mainApp?.activity) {
      return config;
    }

    const mainActivity = mainApp.activity.find(
      (a) => a.$?.["android:name"] === ".MainActivity"
    );

    if (mainActivity) {
      mainActivity.$["android:showWhenLocked"] = "true";
      mainActivity.$["android:turnScreenOn"] = "true";
    }

    return config;
  });
};
