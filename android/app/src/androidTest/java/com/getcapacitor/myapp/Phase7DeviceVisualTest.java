package com.getcapacitor.myapp;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.json.JSONArray;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

@RunWith(AndroidJUnit4.class)
public class Phase7DeviceVisualTest {
    private static final long PAGE_TIMEOUT_MS = 45_000L;
    private static final long JS_TIMEOUT_MS = 8_000L;

    @Test
    public void phase7ProductionVisualsRenderAndAnimate() throws Exception {
        Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        Bundle args = InstrumentationRegistry.getArguments();
        int expectedWidth = Integer.parseInt(args.getString("expectedWidth", "390"));

        Intent launchIntent = instrumentation.getTargetContext()
                .getPackageManager()
                .getLaunchIntentForPackage(instrumentation.getTargetContext().getPackageName());
        assertNotNull("Launch intent missing for target application", launchIntent);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);

        Activity activity = instrumentation.startActivitySync(launchIntent);
        assertNotNull("Target activity did not start", activity);
        instrumentation.waitForIdleSync();

        WebView webView = waitForWebView(instrumentation, activity);
        String url = readUrl(instrumentation, webView);
        assertTrue("WebView must load KriptoAman production, got: " + url,
                url != null && url.startsWith("https://kriptoaman.com"));

        String state = waitForPhase7LiveState(instrumentation, webView);
        String[] parts = state.split("\\|", -1);
        if (parts.length < 10) fail("Unexpected Phase 7 device state: " + state);

        int innerWidth = Integer.parseInt(parts[0]);
        int scrollWidth = Integer.parseInt(parts[1]);
        boolean flow = Boolean.parseBoolean(parts[2]);
        boolean node = Boolean.parseBoolean(parts[3]);
        boolean beamLive = Boolean.parseBoolean(parts[4]);
        String beamAnimation = parts[5];
        String beamPlayState = parts[6];
        boolean orbitLive = Boolean.parseBoolean(parts[7]);
        String orbitAnimation = parts[8];
        String orbitPlayState = parts[9];

        assertTrue("Expected CSS width near " + expectedWidth + "dp, got " + innerWidth,
                Math.abs(innerWidth - expectedWidth) <= 8);
        assertTrue("Horizontal overflow detected: " + scrollWidth + " > " + innerWidth,
                scrollWidth <= innerWidth + 1);
        assertTrue("Phase 7 Live Block Flow marker missing", flow);
        assertTrue("Phase 7 Node Master marker missing", node);
        assertTrue("Verified live event beam is not active", beamLive);
        assertTrue("Live event beam animation missing: " + beamAnimation,
                beamAnimation.contains("zvqEventSweep"));
        assertTrue("Live event beam is not running: " + beamPlayState,
                "running".equals(beamPlayState));
        assertTrue("Verified live Node Master orbit is not active", orbitLive);
        assertTrue("Node Master orbit animation missing: " + orbitAnimation,
                orbitAnimation.contains("zvqOrbitDrift"));
        assertTrue("Node Master orbit is not running: " + orbitPlayState,
                "running".equals(orbitPlayState));

        scrollIntoView(instrumentation, webView, "[data-phase7-visual='live-block-flow']");
        SystemClock.sleep(700L);
        Bitmap flowA = instrumentation.getUiAutomation().takeScreenshot();
        SystemClock.sleep(950L);
        Bitmap flowB = instrumentation.getUiAutomation().takeScreenshot();
        assertNotNull("Unable to capture Live Block Flow frame A", flowA);
        assertNotNull("Unable to capture Live Block Flow frame B", flowB);
        saveBitmap(instrumentation, flowA, "phase7-flow-" + expectedWidth + "-a.png");
        saveBitmap(instrumentation, flowB, "phase7-flow-" + expectedWidth + "-b.png");
        double flowMotion = motionRatio(flowA, flowB);
        assertTrue("Live Block Flow frames appear static; motion ratio=" + flowMotion,
                flowMotion > 0.0025d);

        scrollIntoView(instrumentation, webView, "[data-phase7-visual='node-master']");
        SystemClock.sleep(700L);
        Bitmap nodeA = instrumentation.getUiAutomation().takeScreenshot();
        SystemClock.sleep(1100L);
        Bitmap nodeB = instrumentation.getUiAutomation().takeScreenshot();
        assertNotNull("Unable to capture Node Master frame A", nodeA);
        assertNotNull("Unable to capture Node Master frame B", nodeB);
        saveBitmap(instrumentation, nodeA, "phase7-node-" + expectedWidth + "-a.png");
        saveBitmap(instrumentation, nodeB, "phase7-node-" + expectedWidth + "-b.png");
        double nodeMotion = motionRatio(nodeA, nodeB);
        assertTrue("Node Master frames appear static; motion ratio=" + nodeMotion,
                nodeMotion > 0.0010d);

        activity.finish();
    }

    private static WebView waitForWebView(Instrumentation instrumentation, Activity activity) {
        long deadline = SystemClock.elapsedRealtime() + 20_000L;
        AtomicReference<WebView> ref = new AtomicReference<>();
        while (SystemClock.elapsedRealtime() < deadline) {
            instrumentation.runOnMainSync(() ->
                    ref.set(findWebView(activity.getWindow().getDecorView())));
            if (ref.get() != null) return ref.get();
            SystemClock.sleep(250L);
        }
        fail("Capacitor WebView was not found");
        return null;
    }

    private static WebView findWebView(View view) {
        if (view instanceof WebView) return (WebView) view;
        if (!(view instanceof ViewGroup)) return null;
        ViewGroup group = (ViewGroup) view;
        for (int i = 0; i < group.getChildCount(); i++) {
            WebView found = findWebView(group.getChildAt(i));
            if (found != null) return found;
        }
        return null;
    }

    private static String readUrl(Instrumentation instrumentation, WebView webView) {
        AtomicReference<String> ref = new AtomicReference<>();
        instrumentation.runOnMainSync(() -> ref.set(webView.getUrl()));
        return ref.get();
    }

    private static String waitForPhase7LiveState(Instrumentation instrumentation, WebView webView) throws Exception {
        long deadline = SystemClock.elapsedRealtime() + PAGE_TIMEOUT_MS;
        String last = "";
        while (SystemClock.elapsedRealtime() < deadline) {
            last = evaluate(instrumentation, webView,
                    "(()=>{" +
                    "const f=document.querySelector('[data-phase7-visual=\\"live-block-flow\\"]');" +
                    "const n=document.querySelector('[data-phase7-visual=\\"node-master\\"]');" +
                    "const b=document.querySelector('.zvq-event-beam');" +
                    "const o=document.querySelector('.zvq-node-orbit');" +
                    "const bs=b?getComputedStyle(b):null;" +
                    "const os=o?getComputedStyle(o):null;" +
                    "return [innerWidth,document.documentElement.scrollWidth,!!f,!!n,!!b&&b.classList.contains('is-live'),bs?bs.animationName:'none',bs?bs.animationPlayState:'none',!!o&&o.classList.contains('is-live'),os?os.animationName:'none',os?os.animationPlayState:'none'].join('|');" +
                    "})()");
            String[] p = last.split("\\|", -1);
            if (p.length >= 10
                    && "true".equals(p[2])
                    && "true".equals(p[3])
                    && "true".equals(p[4])
                    && "true".equals(p[7])) {
                return last;
            }
            SystemClock.sleep(750L);
        }
        fail("Phase 7 live visual state did not become ready. Last state: " + last);
        return last;
    }

    private static void scrollIntoView(Instrumentation instrumentation, WebView webView, String selector) throws Exception {
        evaluate(instrumentation, webView,
                "(()=>{const e=document.querySelector(" + quote(selector) + ");if(!e)return 'missing';e.scrollIntoView({block:'center',behavior:'auto'});return 'ok';})()");
        instrumentation.waitForIdleSync();
    }

    private static String evaluate(Instrumentation instrumentation, WebView webView, String script) throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> value = new AtomicReference<>("null");
        instrumentation.runOnMainSync(() ->
                webView.evaluateJavascript(script, raw -> {
                    value.set(raw);
                    latch.countDown();
                }));
        if (!latch.await(JS_TIMEOUT_MS, TimeUnit.MILLISECONDS)) {
            fail("Timed out waiting for WebView JavaScript result");
        }
        String raw = value.get();
        if (raw == null || "null".equals(raw)) return "";
        try {
            return new JSONArray("[" + raw + "]").getString(0);
        } catch (Exception ignored) {
            return raw;
        }
    }

    private static String quote(String value) {
        return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'";
    }

    private static void saveBitmap(Instrumentation instrumentation, Bitmap bitmap, String name) throws Exception {
        File dir = instrumentation.getTargetContext().getExternalFilesDir(null);
        assertNotNull("External evidence directory unavailable", dir);
        File out = new File(dir, name);
        try (FileOutputStream stream = new FileOutputStream(out)) {
            assertTrue("Failed to encode screenshot " + name,
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream));
        }
    }

    private static double motionRatio(Bitmap first, Bitmap second) {
        int width = Math.min(first.getWidth(), second.getWidth());
        int height = Math.min(first.getHeight(), second.getHeight());
        int x0 = Math.max(0, width / 10);
        int x1 = Math.min(width, width - width / 10);
        int y0 = Math.max(0, height / 8);
        int y1 = Math.min(height, height - height / 8);
        int changed = 0;
        int sampled = 0;

        for (int y = y0; y < y1; y += 7) {
            for (int x = x0; x < x1; x += 7) {
                int a = first.getPixel(x, y);
                int b = second.getPixel(x, y);
                int delta = Math.abs(Color.red(a) - Color.red(b))
                        + Math.abs(Color.green(a) - Color.green(b))
                        + Math.abs(Color.blue(a) - Color.blue(b));
                if (delta > 24) changed++;
                sampled++;
            }
        }
        return sampled == 0 ? 0d : (double) changed / (double) sampled;
    }
}
