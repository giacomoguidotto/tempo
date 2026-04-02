"use strict";
const { withProjectBuildGradle } = require("expo/config-plugins");

/**
 * Adds the Notifee local maven repository to the root build.gradle.
 * Notifee ships its core AAR as a local maven repo inside node_modules,
 * which Bun's hoisting makes unreachable via the standard path.
 */
module.exports = function withNotifee(config) {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;

    if (contents.includes("notifee")) {
      return config;
    }

    config.modResults.contents = contents.replace(
      "maven { url 'https://www.jitpack.io' }",
      `maven { url 'https://www.jitpack.io' }
    // Notifee local maven repository
    maven {
      def notifeeDir = providers.exec {
        commandLine("node", "-e", "console.log(require.resolve('@notifee/react-native/package.json').replace('/package.json', ''))")
        workingDir(rootDir.parentFile)
      }.standardOutput.asText.get().trim()
      url "$notifeeDir/android/libs"
    }`
    );

    return config;
  });
};
