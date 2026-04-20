package expo.modules.tempoalarm

import android.content.Context
import android.content.Intent
import android.os.Bundle

object TempoAlarmStateStore {
  const val EXTRA_ALARM_INSTANCE_ID = "alarmInstanceId"
  const val EXTRA_INTENSITY = "intensity"
  const val EXTRA_NOTIFICATION_ID = "notificationId"
  const val EXTRA_RHYTHM_ID = "rhythmId"
  const val EXTRA_RHYTHM_NAME = "rhythmName"
  const val EXTRA_SCHEDULED_AT = "scheduledAt"

  private const val PREFS_NAME = "tempo-alarm"
  private const val KEY_ACTIVE_ALARM_INSTANCE_ID = "active_alarm_instance_id"

  fun clearActiveAlarmInstanceIfMatches(
    context: Context,
    alarmInstanceId: String?,
  ) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val current = prefs.getString(KEY_ACTIVE_ALARM_INSTANCE_ID, null)

    if (alarmInstanceId == null || current == alarmInstanceId) {
      prefs.edit().remove(KEY_ACTIVE_ALARM_INSTANCE_ID).apply()
    }
  }

  fun getActiveAlarmInstanceId(context: Context): String? {
    return context
      .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString(KEY_ACTIVE_ALARM_INSTANCE_ID, null)
  }

  fun setActiveAlarmInstance(
    context: Context,
    alarmInstanceId: String?,
  ) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    if (alarmInstanceId == null) {
      prefs.edit().remove(KEY_ACTIVE_ALARM_INSTANCE_ID).apply()
      return
    }

    prefs.edit().putString(KEY_ACTIVE_ALARM_INSTANCE_ID, alarmInstanceId).apply()
  }

  fun toLaunchOptions(intent: Intent?): Bundle {
    val options = Bundle()
    val extras = intent?.extras ?: Bundle()

    options.putString(
      EXTRA_ALARM_INSTANCE_ID,
      extras.getString(EXTRA_ALARM_INSTANCE_ID),
    )
    options.putString(EXTRA_INTENSITY, extras.getString(EXTRA_INTENSITY))
    options.putString(
      EXTRA_NOTIFICATION_ID,
      extras.getString(EXTRA_NOTIFICATION_ID),
    )
    options.putString(EXTRA_RHYTHM_ID, extras.getString(EXTRA_RHYTHM_ID))
    options.putString(EXTRA_RHYTHM_NAME, extras.getString(EXTRA_RHYTHM_NAME))
    options.putString(EXTRA_SCHEDULED_AT, extras.getString(EXTRA_SCHEDULED_AT))

    return options
  }
}
