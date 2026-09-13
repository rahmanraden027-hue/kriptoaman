package com.kriptoaman.app;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Bundle;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.style.ForegroundColorSpan;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean offlineDialogVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(KriptoAmanNativePlugin.class);
        super.onCreate(savedInstanceState);

        showLaunchBranding();

        WebView webView = bridge != null ? bridge.getWebView() : null;
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(true);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setNestedScrollingEnabled(true);
            webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        }

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
    public void onResume() {
        super.onResume();
        showOfflineRecoveryIfNeeded();
    }

    private void showLaunchBranding() {
        ViewGroup content = findViewById(android.R.id.content);
        if (content == null) return;

        final int background = Color.rgb(0, 4, 13);
        final int gold = Color.rgb(231, 180, 56);
        final int blue = Color.rgb(23, 216, 255);
        final int white = Color.rgb(244, 248, 255);

        FrameLayout overlay = new FrameLayout(this);
        overlay.setBackgroundColor(background);
        overlay.setClickable(true);
        overlay.setFocusable(true);
        overlay.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);

        LinearLayout stack = new LinearLayout(this);
        stack.setOrientation(LinearLayout.VERTICAL);
        stack.setGravity(Gravity.CENTER_HORIZONTAL);

        int availableWidth = Math.max(dp(220), getResources().getDisplayMetrics().widthPixels - dp(48));
        int logoSize = Math.min(dp(300), availableWidth);

        ImageView emblem = new ImageView(this);
        emblem.setImageResource(R.drawable.ic_launcher_foreground_brand);
        emblem.setScaleType(ImageView.ScaleType.FIT_CENTER);
        emblem.setAdjustViewBounds(true);
        emblem.setContentDescription(null);
        stack.addView(emblem, new LinearLayout.LayoutParams(logoSize, logoSize));

        TextView wordmark = new TextView(this);
        SpannableString brand = new SpannableString("KriptoAman");
        brand.setSpan(new ForegroundColorSpan(white), 0, 6, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        brand.setSpan(new ForegroundColorSpan(gold), 6, 10, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        wordmark.setText(brand);
        wordmark.setTextSize(TypedValue.COMPLEX_UNIT_SP, 36);
        wordmark.setTypeface(Typeface.create("sans-serif", Typeface.BOLD));
        wordmark.setGravity(Gravity.CENTER);
        wordmark.setIncludeFontPadding(false);
        LinearLayout.LayoutParams wordmarkParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        wordmarkParams.topMargin = dp(-8);
        stack.addView(wordmark, wordmarkParams);

        LinearLayout accent = new LinearLayout(this);
        accent.setOrientation(LinearLayout.HORIZONTAL);
        accent.setGravity(Gravity.CENTER_VERTICAL);

        View leftLine = new View(this);
        leftLine.setBackgroundColor(gold);
        LinearLayout.LayoutParams lineParamsLeft = new LinearLayout.LayoutParams(0, dp(1), 1f);
        lineParamsLeft.setMargins(0, 0, dp(10), 0);
        accent.addView(leftLine, lineParamsLeft);

        TextView gem = new TextView(this);
        gem.setText("◆");
        gem.setTextColor(blue);
        gem.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        gem.setGravity(Gravity.CENTER);
        accent.addView(gem, new LinearLayout.LayoutParams(dp(18), dp(22)));

        View rightLine = new View(this);
        rightLine.setBackgroundColor(gold);
        LinearLayout.LayoutParams lineParamsRight = new LinearLayout.LayoutParams(0, dp(1), 1f);
        lineParamsRight.setMargins(dp(10), 0, 0, 0);
        accent.addView(rightLine, lineParamsRight);

        LinearLayout.LayoutParams accentParams = new LinearLayout.LayoutParams(dp(190), dp(22));
        accentParams.topMargin = dp(14);
        stack.addView(accent, accentParams);

        FrameLayout.LayoutParams stackParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        stackParams.gravity = Gravity.CENTER;
        stackParams.leftMargin = dp(24);
        stackParams.rightMargin = dp(24);
        overlay.addView(stack, stackParams);

        content.addView(overlay, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        overlay.postDelayed(() -> {
            if (overlay.getParent() == null) return;
            overlay.animate()
                    .alpha(0f)
                    .setDuration(260L)
                    .withEndAction(() -> {
                        if (overlay.getParent() instanceof ViewGroup) {
                            ((ViewGroup) overlay.getParent()).removeView(overlay);
                        }
                    })
                    .start();
        }, 950L);
    }

    private int dp(int value) {
        return Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                getResources().getDisplayMetrics()
        ));
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
