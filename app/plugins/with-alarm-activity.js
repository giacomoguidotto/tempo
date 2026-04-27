const fs = require("fs");
const path = require("path");
const {
  withAndroidManifest,
  withDangerousMod,
} = require("expo/config-plugins");

function packageToPath(packageName) {
  return packageName.replace(/\./g, "/");
}

function createAlarmActivitySource(packageName) {
  return `package ${packageName}

import android.content.Intent
import android.os.Bundle

import androidx.activity.OnBackPressedCallback

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper
import expo.modules.tempoalarm.TempoAlarmStateStore

class TempoAlarmActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    TempoAlarmStateStore.setActiveAlarmInstance(
      applicationContext,
      intent?.getStringExtra(TempoAlarmStateStore.EXTRA_ALARM_INSTANCE_ID)
    )
    super.onCreate(null)

    // Predictive back compatible: register callback via onBackPressedDispatcher
    onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
      override fun handleOnBackPressed() {
        finish()
      }
    })
  }

  override fun getMainComponentName(): String = "alarm"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    val initialProps = TempoAlarmStateStore.toLaunchOptions(intent)

    return ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(
        this,
        mainComponentName,
        fabricEnabled
      ) {
        override fun getLaunchOptions(): Bundle = initialProps
      }
    )
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    TempoAlarmStateStore.setActiveAlarmInstance(
      applicationContext,
      intent.getStringExtra(TempoAlarmStateStore.EXTRA_ALARM_INSTANCE_ID)
    )
    recreate()
  }

  override fun onDestroy() {
    TempoAlarmStateStore.clearActiveAlarmInstanceIfMatches(
      applicationContext,
      intent?.getStringExtra(TempoAlarmStateStore.EXTRA_ALARM_INSTANCE_ID)
    )
    super.onDestroy()
  }
}
`;
}

/**
 * Registers a dedicated alarm activity and keeps it regenerated
 * from plugin state so Expo prebuilds do not wipe it out.
 */
module.exports = function withAlarmActivity(config) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const mainApp = manifest.application?.[0];
    if (!mainApp) {
      return config;
    }

    mainApp.activity ||= [];

    // Enable predictive back gesture (SDK 35+)
    mainApp.$["android:enableOnBackInvokedCallback"] = "true";

    const mainActivity = mainApp.activity.find(
      (a) => a.$?.["android:name"] === ".MainActivity"
    );

    if (mainActivity) {
      delete mainActivity.$["android:showWhenLocked"];
      delete mainActivity.$["android:turnScreenOn"];
    }

    const hasAlarmActivity = mainApp.activity.some(
      (a) => a.$?.["android:name"] === ".TempoAlarmActivity"
    );

    if (!hasAlarmActivity) {
      mainApp.activity.push({
        $: {
          "android:name": ".TempoAlarmActivity",
          "android:excludeFromRecents": "true",
          "android:exported": "false",
          "android:launchMode": "singleTask",
          "android:screenOrientation": "portrait",
          "android:showWhenLocked": "true",
          "android:theme": "@style/AppTheme",
          "android:turnScreenOn": "true",
          "android:windowSoftInputMode": "adjustResize",
        },
      });
    }

    return config;
  });

  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const packageName = config.android?.package;
      if (!packageName) {
        return config;
      }

      const activityPath = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/java",
        packageToPath(packageName),
        "TempoAlarmActivity.kt"
      );

      fs.mkdirSync(path.dirname(activityPath), { recursive: true });
      fs.writeFileSync(activityPath, createAlarmActivitySource(packageName));
      return config;
    },
  ]);

  return config;
};
