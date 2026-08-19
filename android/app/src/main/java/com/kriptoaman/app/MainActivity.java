package com.kriptoaman.app;

import android.app.AlertDialog;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean offlineDialogVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(KriptoAmanNativePlugin.class);
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (bridge != null && bridge.getWebView() != null && bridge.getWebView().canGoBack()) {
                    bridge.getWebView().goBack();
                    return;
                }
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
            }
        });

        showOfflineRecoveryIfNeeded();
    }

    @Override
    protected void onResume() {
        super.onResume();
        showOfflineRecoveryIfNeeded();
    }

    private boolean hasInternetConnection() {
        ConnectivityManager manager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (manager == null) return false;
        Network network = manager.getActiveNetwork();
        NetworkCapabilities caps = network != null ? manager.getNetworkCapabilities(network) : null;
        return caps != null
                && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
    }

    private void showOfflineRecoveryIfNeeded() {
        if (hasInternetConnection() || isFinishing() || offlineDialogVisible) return;

        offlineDialogVisible = true;
        new AlertDialog.Builder(this)
                .setTitle("KriptoAman sedang offline")
                .setMessage("Koneksi internet diperlukan untuk sinkronisasi akun dan data live. Setelah jaringan tersedia, pilih Coba lagi.")
                .setCancelable(false)
                .setPositiveButton("Coba lagi", (dialog, which) -> {
                    offlineDialogVisible = false;
                    if (hasInternetConnection()) {
                        if (bridge != null && bridge.getWebView() != null) bridge.getWebView().reload();
                    } else {
                        showOfflineRecoveryIfNeeded();
                    }
                })
                .setNegativeButton("Tutup aplikasi", (dialog, which) -> {
                    offlineDialogVisible = false;
                    finish();
                })
                .setOnDismissListener(dialog -> offlineDialogVisible = false)
                .show();
    }
}
