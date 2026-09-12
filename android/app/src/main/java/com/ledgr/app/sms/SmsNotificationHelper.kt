package com.ledgr.app.sms

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.ledgr.app.MainActivity
import com.ledgr.app.R
import java.util.regex.Pattern

/**
 * Heads-up SMS review notification with Track / Ignore / Review actions.
 * Lock-screen copy stays privacy-safe unless the user opts into richer details.
 */
object SmsNotificationHelper {
  private const val CHANNEL_ID = "ledgr-sms-review-v2"
  private const val CHANNEL_NAME = "SMS expense review"

  const val PREFS = "ledgr_sms"
  const val KEY_LOCK_SCREEN_DETAILS = "lock_screen_details_enabled"

  fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    // Remove legacy lower-importance channel if present so heads-up works on upgrade.
    try {
      manager.deleteNotificationChannel("ledgr-sms-review")
    } catch (_: Exception) {
      // ignore
    }
    val channel =
      NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH).apply {
        description = "Quickly track or dismiss bank SMS expenses"
        enableVibration(true)
        setBypassDnd(false)
        lockscreenVisibility = NotificationCompat.VISIBILITY_PRIVATE
      }
    manager.createNotificationChannel(channel)
  }

  fun setLockScreenDetailsEnabled(context: Context, enabled: Boolean) {
    context
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_LOCK_SCREEN_DETAILS, enabled)
      .apply()
  }

  fun isLockScreenDetailsEnabled(context: Context): Boolean {
    return context
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getBoolean(KEY_LOCK_SCREEN_DETAILS, false)
  }

  fun guessAmountSnippet(body: String): String? {
    val patterns =
      listOf(
        Pattern.compile("(?i)(?:EGP|USD|EUR|SAR|AED|LE|E£|\\$)\\s*([0-9]+(?:[.,][0-9]{1,3})?)"),
        Pattern.compile("(?i)(?:amount|amt|sum|خصم|مبلغ|قيمة)[^0-9]{0,12}([0-9]+(?:[.,][0-9]{1,3})?)"),
        Pattern.compile("\\b([0-9]{1,3}(?:,[0-9]{3})+(?:\\.[0-9]{2})?)\\b"),
        Pattern.compile("\\b([0-9]+\\.[0-9]{2})\\b"),
      )
    for (pattern in patterns) {
      val matcher = pattern.matcher(body)
      if (matcher.find()) {
        return matcher.group(1)
      }
    }
    return null
  }

  fun looksLikeTransaction(body: String): Boolean {
    if (guessAmountSnippet(body) != null) {
      return true
    }
    val keywords =
      Pattern.compile(
        "(?i)(debit|credit|purchase|spent|withdraw|payment|transfer|POS|ATM|InstaPay|خصم|شراء|مدفوع|تحويل|مبلغ)",
      )
    return keywords.matcher(body).find()
  }

  private fun reviewIntent(
    context: Context,
    sender: String,
    body: String,
    receivedAt: Long,
    autoAction: String,
  ): Intent {
    return Intent(context, MainActivity::class.java).apply {
      action = ACTION_SMS_REVIEW
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
      putExtra(EXTRA_SENDER, sender)
      putExtra(EXTRA_BODY, body)
      putExtra(EXTRA_RECEIVED_AT, receivedAt)
      putExtra(EXTRA_AUTO_ACTION, autoAction)
    }
  }

  fun showReviewNotification(
    context: Context,
    sender: String,
    body: String,
    receivedAt: Long,
  ) {
    if (!looksLikeTransaction(body)) {
      return
    }
    ensureChannel(context)

    val rich = isLockScreenDetailsEnabled(context)
    val amount = if (rich) guessAmountSnippet(body) else null
    val privateTitle =
      when {
        rich && amount != null -> "Track expense · $amount?"
        rich -> "Money SMS detected"
        else -> "Track this expense?"
      }
    val privateText =
      if (rich) {
        "From $sender — Track, Ignore, or Review"
      } else {
        "Tap Track to save, or open Ledgr to categorize"
      }
    val privateBig =
      if (rich) {
        val preview = body.replace('\n', ' ').take(120)
        "$preview\n\nFrom $sender"
      } else {
        "A bank or wallet message looks like a transaction. Track it under Other, ignore it, or open Ledgr to pick a category."
      }

    val publicNotification =
      NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle("Expense to review")
        .setContentText("Open Ledgr to categorize")
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .build()

    val requestCode = (receivedAt % Int.MAX_VALUE).toInt()
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

    val contentPending =
      PendingIntent.getActivity(
        context,
        requestCode,
        reviewIntent(context, sender, body, receivedAt, AUTO_REVIEW),
        flags,
      )
    val trackPending =
      PendingIntent.getActivity(
        context,
        requestCode + 1,
        reviewIntent(context, sender, body, receivedAt, AUTO_TRACK),
        flags,
      )
    val ignorePending =
      PendingIntent.getActivity(
        context,
        requestCode + 2,
        reviewIntent(context, sender, body, receivedAt, AUTO_IGNORE),
        flags,
      )

    val notification =
      NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle(privateTitle)
        .setContentText(privateText)
        .setStyle(NotificationCompat.BigTextStyle().bigText(privateBig))
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setCategory(NotificationCompat.CATEGORY_MESSAGE)
        .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
        .setPublicVersion(publicNotification)
        .setAutoCancel(true)
        .setContentIntent(contentPending)
        .addAction(0, "Track", trackPending)
        .addAction(0, "Ignore", ignorePending)
        .addAction(0, "Review", contentPending)
        .setDefaults(NotificationCompat.DEFAULT_ALL)
        .build()

    try {
      NotificationManagerCompat.from(context).notify(requestCode, notification)
    } catch (_: SecurityException) {
      // POST_NOTIFICATIONS may be denied — queue still holds the SMS for in-app review.
    }
  }

  const val ACTION_SMS_REVIEW = "com.ledgr.app.SMS_REVIEW"
  const val EXTRA_SENDER = "sms_sender"
  const val EXTRA_BODY = "sms_body"
  const val EXTRA_RECEIVED_AT = "sms_received_at"
  const val EXTRA_AUTO_ACTION = "sms_auto_action"
  const val AUTO_TRACK = "track"
  const val AUTO_IGNORE = "ignore"
  const val AUTO_REVIEW = "review"
}
