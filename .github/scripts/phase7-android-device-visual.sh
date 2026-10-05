#!/usr/bin/env bash
set -euo pipefail

mkdir -p device-evidence

app_apk="$(find android/app/build/outputs/apk -type f -name '*.apk' ! -path '*androidTest*' -print | grep -E '/platform/debug/' | head -n 1 || true)"
test_apk="$(find android/app/build/outputs/apk -type f -name '*.apk' -path '*androidTest*' -print | grep -E '/platform/debug/' | head -n 1 || true)"

if [[ -z "$app_apk" ]]; then
  echo "Platform debug APK not found. Available APKs:" >&2
  find android/app/build/outputs -type f -name '*.apk' -print >&2 || true
  exit 2
fi
if [[ -z "$test_apk" ]]; then
  echo "Platform instrumentation APK not found. Available APKs:" >&2
  find android/app/build/outputs -type f -name '*.apk' -print >&2 || true
  exit 3
fi

echo "Platform APK: $app_apk"
echo "Test APK: $test_apk"

adb install -r "$app_apk"
adb install -r "$test_apk"
adb shell settings put global window_animation_scale 1
adb shell settings put global transition_animation_scale 1
adb shell settings put global animator_duration_scale 1
adb shell settings put system font_scale 1.0

run_case() {
  local width="$1"
  local density="$2"

  echo "=== Phase 7 Android device-class ${width}dp ==="
  adb shell wm size 1080x2400
  adb shell wm density "$density"
  adb shell am force-stop com.kriptoaman.app || true
  adb logcat -c

  if adb shell am instrument -w \
      -e class com.getcapacitor.myapp.Phase7DeviceVisualTest \
      -e expectedWidth "$width" \
      com.kriptoaman.app.test/androidx.test.runner.AndroidJUnitRunner \
      > "device-evidence/instrument-${width}.txt" 2>&1; then
    cat "device-evidence/instrument-${width}.txt"
  else
    local status="$?"
    cat "device-evidence/instrument-${width}.txt" || true
    adb logcat -d > "device-evidence/logcat-${width}.txt" || true
    adb shell dumpsys window windows > "device-evidence/window-${width}.txt" || true
    echo "Instrumentation failed for ${width}dp" >&2
    exit "$status"
  fi

  adb logcat -d > "device-evidence/logcat-${width}.txt" || true
  adb shell dumpsys window windows > "device-evidence/window-${width}.txt" || true
  grep -q 'OK (1 test)' "device-evidence/instrument-${width}.txt"

  adb pull /sdcard/Android/data/com.kriptoaman.app/files/. device-evidence/ >/dev/null
}

run_case 390 443
run_case 430 402

adb shell wm size reset || true
adb shell wm density reset || true

for file in \
  phase7-flow-390-a.png phase7-flow-390-b.png \
  phase7-node-390-a.png phase7-node-390-b.png \
  phase7-flow-430-a.png phase7-flow-430-b.png \
  phase7-node-430-a.png phase7-node-430-b.png
do
  test -s "device-evidence/$file"
done

echo 'PHASE7_ANDROID_DEVICE_VISUAL=PASS'
