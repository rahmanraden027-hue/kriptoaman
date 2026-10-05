package com.getcapacitor.myapp;

import static org.junit.Assert.assertTrue;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Basic package-identity smoke shared by both Android product flavors.
 */
@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {

    @Test
    public void useAppContext() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        String packageName = appContext.getPackageName();
        assertTrue(
                "Unexpected KriptoAman Android package: " + packageName,
                "com.kriptoaman.app".equals(packageName) || "com.kriptoaman.wallet".equals(packageName)
        );
    }
}
