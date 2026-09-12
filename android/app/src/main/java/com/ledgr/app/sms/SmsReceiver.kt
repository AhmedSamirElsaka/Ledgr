package com.ledgr.app.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import org.json.JSONArray
import org.json.JSONObject

/**
 * Queues incoming SMS, notifies JS when alive, and posts a normal review
 * notification so the user can categorize when the app is in the background.
 */
class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION != intent.action) {
      return
    }
    val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val existing = prefs.getString(KEY_QUEUE, "[]") ?: "[]"
    val queue =
      try {
        JSONArray(existing)
      } catch (_: Exception) {
        JSONArray()
      }

    for (sms in messages) {
      val sender = sms.displayOriginatingAddress ?: "unknown"
      val body = sms.messageBody ?: ""
      val receivedAt = sms.timestampMillis
      val entry =
        JSONObject()
          .put("sender", sender)
          .put("body", body)
          .put("receivedAt", receivedAt)
      queue.put(entry)
      SmsReceivedModule.emitIncoming(sender, body, receivedAt)
      SmsNotificationHelper.showReviewNotification(context, sender, body, receivedAt)
    }

    while (queue.length() > 100) {
      queue.remove(0)
    }
    prefs.edit().putString(KEY_QUEUE, queue.toString()).apply()
  }

  companion object {
    const val PREFS = "ledgr_sms"
    const val KEY_QUEUE = "pending_sms_queue"

    fun drainQueue(context: Context): JSONArray {
      val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      val raw = prefs.getString(KEY_QUEUE, "[]") ?: "[]"
      prefs.edit().putString(KEY_QUEUE, "[]").apply()
      return try {
        JSONArray(raw)
      } catch (_: Exception) {
        JSONArray()
      }
    }
  }
}
