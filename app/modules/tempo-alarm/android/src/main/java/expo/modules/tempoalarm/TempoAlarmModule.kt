package expo.modules.tempoalarm

import android.app.NotificationManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TempoAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TempoAlarm")

    Function("getInitialAlarmPayload") {
      val context = appContext.reactContext ?: return@Function emptyMap<String, String?>()
      val activity = appContext.currentActivity
      val options = TempoAlarmStateStore.toLaunchOptions(activity?.intent)

      mapOf(
        TempoAlarmStateStore.EXTRA_ALARM_INSTANCE_ID to
          options.getString(TempoAlarmStateStore.EXTRA_ALARM_INSTANCE_ID),
        TempoAlarmStateStore.EXTRA_INTENSITY to
          options.getString(TempoAlarmStateStore.EXTRA_INTENSITY),
        TempoAlarmStateStore.EXTRA_NOTIFICATION_ID to
          options.getString(TempoAlarmStateStore.EXTRA_NOTIFICATION_ID),
        TempoAlarmStateStore.EXTRA_RHYTHM_ID to
          options.getString(TempoAlarmStateStore.EXTRA_RHYTHM_ID),
        TempoAlarmStateStore.EXTRA_RHYTHM_NAME to
          options.getString(TempoAlarmStateStore.EXTRA_RHYTHM_NAME),
        TempoAlarmStateStore.EXTRA_SCHEDULED_AT to
          options.getString(TempoAlarmStateStore.EXTRA_SCHEDULED_AT),
      )
    }

    Function("getActiveAlarmInstanceId") {
      val context = appContext.reactContext ?: return@Function null
      TempoAlarmStateStore.getActiveAlarmInstanceId(context)
    }

    AsyncFunction("clearActiveAlarmInstance") { alarmInstanceId: String? ->
      val context = appContext.reactContext ?: return@AsyncFunction null
      TempoAlarmStateStore.clearActiveAlarmInstanceIfMatches(context, alarmInstanceId)
      null
    }

    AsyncFunction("finishAlarmActivity") {
      appContext.currentActivity?.runOnUiThread {
        appContext.currentActivity?.finish()
      }
      null
    }

    AsyncFunction("openMainApp") {
      val context = appContext.reactContext ?: return@AsyncFunction null
      val intent =
        context.packageManager.getLaunchIntentForPackage(context.packageName)
          ?: return@AsyncFunction null

      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
      context.startActivity(intent)
      null
    }

    AsyncFunction("openFullScreenIntentSettings") {
      val context = appContext.reactContext ?: return@AsyncFunction null

      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        return@AsyncFunction null
      }

      val intent =
        Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
          data = Uri.parse("package:${context.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

      context.startActivity(intent)
      null
    }

    AsyncFunction("canUseFullScreenIntent") {
      val context = appContext.reactContext ?: return@AsyncFunction false

      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        return@AsyncFunction true
      }

      val notificationManager = context.getSystemService(NotificationManager::class.java)
      notificationManager?.canUseFullScreenIntent() ?: false
    }
  }
}
