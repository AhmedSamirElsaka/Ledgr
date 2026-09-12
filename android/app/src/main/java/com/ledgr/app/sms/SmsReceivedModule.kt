package com.ledgr.app.sms

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsReceivedModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  override fun initialize() {
    super.initialize()
    instance = this
  }

  override fun invalidate() {
    if (instance === this) {
      instance = null
    }
    super.invalidate()
  }

  @ReactMethod
  fun addListener(@Suppress("UNUSED_PARAMETER") eventName: String) {
    // Required for NativeEventEmitter
  }

  @ReactMethod
  fun removeListeners(@Suppress("UNUSED_PARAMETER") count: Int) {
    // Required for NativeEventEmitter
  }

  @ReactMethod
  fun drainPending(promise: Promise) {
    try {
      val queue = SmsReceiver.drainQueue(reactContext)
      val array = Arguments.createArray()
      for (i in 0 until queue.length()) {
        val obj = queue.getJSONObject(i)
        val map = Arguments.createMap()
        map.putString("sender", obj.optString("sender", "unknown"))
        map.putString("body", obj.optString("body", ""))
        map.putDouble("receivedAt", obj.optLong("receivedAt", System.currentTimeMillis()).toDouble())
        array.pushMap(map)
      }
      promise.resolve(array)
    } catch (e: Exception) {
      promise.reject("SMS_DRAIN_FAILED", e)
    }
  }

  /** Mirrors JS MMKV privacy pref so the SMS receiver can redact lock-screen copy. */
  @ReactMethod
  fun setLockScreenDetailsEnabled(enabled: Boolean, promise: Promise) {
    try {
      SmsNotificationHelper.setLockScreenDetailsEnabled(reactContext, enabled)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("SMS_PRIVACY_PREF_FAILED", e)
    }
  }

  fun emit(sender: String, body: String, receivedAt: Long) {
    if (!reactContext.hasActiveReactInstance()) {
      return
    }
    val map = Arguments.createMap()
    map.putString("sender", sender)
    map.putString("body", body)
    map.putDouble("receivedAt", receivedAt.toDouble())
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(EVENT, map)
  }

  companion object {
    const val NAME = "LedgrSmsReceived"
    const val EVENT = "ledgrSmsReceived"

    @Volatile private var instance: SmsReceivedModule? = null

    fun emitIncoming(sender: String, body: String, receivedAt: Long) {
      instance?.emit(sender, body, receivedAt)
    }
  }
}
