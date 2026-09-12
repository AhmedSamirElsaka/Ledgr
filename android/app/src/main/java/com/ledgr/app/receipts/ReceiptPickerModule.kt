package com.ledgr.app.receipts

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.webkit.MimeTypeMap
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Arguments
import java.io.File
import java.io.FileOutputStream

class ReceiptPickerModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var pickerPromise: Promise? = null

  private val activityEventListener: ActivityEventListener =
    object : BaseActivityEventListener() {
      override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
      ) {
        if (requestCode != REQUEST_PICK) {
          return
        }
        val promise = pickerPromise ?: return
        pickerPromise = null

        if (resultCode != Activity.RESULT_OK || data?.data == null) {
          promise.resolve(null)
          return
        }

        try {
          val uri = data.data!!
          val mimeType = reactContext.contentResolver.getType(uri)
          val ext = extensionForMime(mimeType)
          val cacheDir = File(reactContext.cacheDir, "receipt-picks")
          if (!cacheDir.exists()) {
            cacheDir.mkdirs()
          }
          val outFile = File(cacheDir, "pick-${System.currentTimeMillis()}.$ext")
          reactContext.contentResolver.openInputStream(uri).use { input ->
            if (input == null) {
              promise.reject("RECEIPT_PICK_FAILED", "Could not open selected image")
              return
            }
            FileOutputStream(outFile).use { output -> input.copyTo(output) }
          }
          val map = Arguments.createMap()
          map.putString("uri", Uri.fromFile(outFile).toString())
          map.putString("mimeType", mimeType)
          promise.resolve(map)
        } catch (error: Exception) {
          promise.reject("RECEIPT_PICK_FAILED", error)
        }
      }
    }

  init {
    reactContext.addActivityEventListener(activityEventListener)
  }

  override fun getName(): String = NAME

  override fun invalidate() {
    reactContext.removeActivityEventListener(activityEventListener)
    super.invalidate()
  }

  @ReactMethod
  fun pickImage(promise: Promise) {
    val activity = reactContext.currentActivity
    if (activity == null) {
      promise.reject("RECEIPT_PICK_UNAVAILABLE", "No activity")
      return
    }
    if (pickerPromise != null) {
      promise.reject("RECEIPT_PICK_IN_PROGRESS", "A pick is already in progress")
      return
    }
    pickerPromise = promise
    val intent =
      Intent(Intent.ACTION_GET_CONTENT).apply {
        type = "image/*"
        addCategory(Intent.CATEGORY_OPENABLE)
      }
    activity.startActivityForResult(
      Intent.createChooser(intent, "Select receipt"),
      REQUEST_PICK,
    )
  }

  private fun extensionForMime(mimeType: String?): String {
    if (mimeType.isNullOrBlank()) {
      return "jpg"
    }
    val mapped = MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType)
    if (!mapped.isNullOrBlank()) {
      return mapped
    }
    return when {
      mimeType.contains("png") -> "png"
      mimeType.contains("webp") -> "webp"
      else -> "jpg"
    }
  }

  companion object {
    const val NAME = "LedgrReceiptPicker"
    private const val REQUEST_PICK = 0x4c52 // 'LR'
  }
}
