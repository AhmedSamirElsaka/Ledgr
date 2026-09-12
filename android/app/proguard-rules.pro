# Add project specific ProGuard rules here.
# Enabled for release builds (see app/build.gradle minifyEnabled).

# React Native / Hermes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }
-keep class com.facebook.yoga.** { *; }

# Reanimated / Worklets
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.worklets.** { *; }
-dontwarn com.swmansion.reanimated.**
-dontwarn com.swmansion.worklets.**

# op-sqlite
-keep class com.op.sqlite.** { *; }
-keep class com.opensoftware.** { *; }
-dontwarn com.op.sqlite.**

# MMKV / Nitro
-keep class com.tencent.mmkv.** { *; }
-dontwarn com.tencent.mmkv.**
-keep class com.margelo.nitro.** { *; }
-dontwarn com.margelo.nitro.**

# Notifee depends on WorkManager + Room; R8 must not strip Room databases.
-keep class io.invertase.notifee.** { *; }
-dontwarn io.invertase.notifee.**
-keep class androidx.work.** { *; }
-keep interface androidx.work.** { *; }
-dontwarn androidx.work.**
-keep class * extends androidx.room.RoomDatabase { *; }
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao class * { *; }
-keep class androidx.room.** { *; }
-dontwarn androidx.room.**

# Keychain / biometrics
-keep class com.oblador.keychain.** { *; }

# Gesture Handler / Screens / Safe Area / SVG / Share / FS / Bootsplash
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }
-keep class com.horcrux.svg.** { *; }
-keep class cl.json.** { *; }
-keep class com.rnfs.** { *; }
-keep class com.zoontek.rnbootsplash.** { *; }
-keep class com.oblador.vectoricons.** { *; }
-keep class com.BV.LinearGradient.** { *; }
-keep class com.mkuczera.** { *; }
-keep class com.reactnativerestart.** { *; }
-keep class com.reactnativecommunity.** { *; }

# Custom native modules
-keep class com.ledgr.app.sms.** { *; }
-keep class com.ledgr.app.receipts.** { *; }
-keep class com.ledgr.app.** { *; }
