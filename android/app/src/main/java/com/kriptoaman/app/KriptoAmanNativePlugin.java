package com.kriptoaman.app;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.Uri;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.BatteryManager;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "KriptoAmanNative")
public class KriptoAmanNativePlugin extends Plugin {

    @PluginMethod
    public void getDeviceStatus(PluginCall call) {
        JSObject result = new JSObject();

        ConnectivityManager connectivityManager =
                (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        boolean connected = false;
        String transport = "offline";

        if (connectivityManager != null) {
            Network network = connectivityManager.getActiveNetwork();
            NetworkCapabilities caps = network != null ? connectivityManager.getNetworkCapabilities(network) : null;
            if (caps != null) {
                connected = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
                if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) transport = "wifi";
                else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) transport = "cellular";
                else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) transport = "ethernet";
                else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) transport = "vpn";
                else transport = "other";
            }
        }

        BatteryManager batteryManager = (BatteryManager) getContext().getSystemService(Context.BATTERY_SERVICE);
        int batteryLevel = batteryManager != null
                ? batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                : -1;

        String versionName = "unknown";
        long versionCode = 0;
        try {
            android.content.pm.PackageInfo info = getContext().getPackageManager()
                    .getPackageInfo(getContext().getPackageName(), 0);
            versionName = info.versionName != null ? info.versionName : "unknown";
            versionCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                    ? info.getLongVersionCode()
                    : info.versionCode;
        } catch (Exception ignored) {
        }

        result.put("connected", connected);
        result.put("transport", transport);
        result.put("batteryLevel", batteryLevel);
        result.put("manufacturer", Build.MANUFACTURER);
        result.put("model", Build.MODEL);
        result.put("androidVersion", Build.VERSION.RELEASE);
        result.put("sdkInt", Build.VERSION.SDK_INT);
        result.put("appVersion", versionName);
        result.put("versionCode", versionCode);
        call.resolve(result);
    }

    @PluginMethod
    @SuppressWarnings("deprecation")
    public void haptic(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager manager = (VibratorManager) getContext().getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                Vibrator vibrator = manager != null ? manager.getDefaultVibrator() : null;
                vibrate(vibrator);
            } else {
                Vibrator vibrator = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
                vibrate(vibrator);
            }
            call.resolve();
        } catch (Exception error) {
            call.reject("Haptic feedback unavailable", error);
        }
    }

    @SuppressWarnings("deprecation")
    private void vibrate(Vibrator vibrator) {
        if (vibrator == null || !vibrator.hasVibrator()) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(28, VibrationEffect.DEFAULT_AMPLITUDE));
        } else {
            vibrator.vibrate(28);
        }
    }

    @PluginMethod
    public void openExternalWallet(PluginCall call) {
        String uri = call.getString("uri");
        String packageName = call.getString("packageName");
        String fallbackUrl = call.getString("fallbackUrl");

        if (uri == null || uri.trim().isEmpty()) {
            call.reject("Wallet URI is required");
            return;
        }

        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(uri));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            if (packageName != null && !packageName.trim().isEmpty()) {
                intent.setPackage(packageName.trim());
            }
            getContext().startActivity(intent);

            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("fallback", false);
            call.resolve(result);
            return;
        } catch (ActivityNotFoundException notInstalled) {
            // Continue to the universal link fallback below.
        } catch (Exception directError) {
            if (fallbackUrl == null || fallbackUrl.trim().isEmpty()) {
                call.reject("External wallet handoff unavailable", directError);
                return;
            }
        }

        if (fallbackUrl == null || fallbackUrl.trim().isEmpty()) {
            call.reject("Target wallet is not installed and no fallback URL was provided");
            return;
        }

        try {
            Intent fallback = new Intent(Intent.ACTION_VIEW, Uri.parse(fallbackUrl));
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(fallback);

            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("fallback", true);
            call.resolve(result);
        } catch (Exception fallbackError) {
            call.reject("Unable to open wallet or fallback URL", fallbackError);
        }
    }

    @PluginMethod
    public void shareText(PluginCall call) {
        String text = call.getString("text", "KriptoAman — https://kriptoaman.com");
        String title = call.getString("title", "Bagikan KriptoAman");
        try {
            Intent sendIntent = new Intent(Intent.ACTION_SEND);
            sendIntent.setType("text/plain");
            sendIntent.putExtra(Intent.EXTRA_TEXT, text);
            Intent chooser = Intent.createChooser(sendIntent, title);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);
            call.resolve();
        } catch (Exception error) {
            call.reject("Native share unavailable", error);
        }
    }
}
