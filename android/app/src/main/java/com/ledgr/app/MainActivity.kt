package com.ledgr.app

import android.content.Intent
import android.os.Bundle
import com.ledgr.app.sms.SmsNotificationHelper
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.bridge.Arguments
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "Ledgr"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(null)
    emitSmsReviewIfPresent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    emitSmsReviewIfPresent(intent)
  }

  private fun emitSmsReviewIfPresent(intent: Intent?) {
    if (intent == null) {
      return
    }
    if (SmsNotificationHelper.ACTION_SMS_REVIEW != intent.action) {
      return
    }
    val sender = intent.getStringExtra(SmsNotificationHelper.EXTRA_SENDER) ?: return
    val body = intent.getStringExtra(SmsNotificationHelper.EXTRA_BODY) ?: return
    val receivedAt =
        intent.getLongExtra(SmsNotificationHelper.EXTRA_RECEIVED_AT, System.currentTimeMillis())
    val autoAction =
        intent.getStringExtra(SmsNotificationHelper.EXTRA_AUTO_ACTION)
            ?: SmsNotificationHelper.AUTO_REVIEW

    window.decorView.postDelayed(
        {
          try {
            val ctx = reactNativeHost.reactInstanceManager.currentReactContext ?: return@postDelayed
            val payload =
                Arguments.createMap().apply {
                  putString("sender", sender)
                  putString("body", body)
                  putDouble("receivedAt", receivedAt.toDouble())
                  putString("autoAction", autoAction)
                }
            ctx
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("LedgrSmsReview", payload)
          } catch (_: Exception) {
            // Queue drain on JS bootstrap still covers this SMS.
          }
        },
        700,
    )
  }
}
