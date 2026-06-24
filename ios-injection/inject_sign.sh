#!/usr/bin/env bash
# Usage: ./inject_sign.sh <input.ipa> <your.dylib> <signing-identity> [provisioning.mobileprovision] [output.ipa]
#
# Example:
#   ./inject_sign.sh MyApp.ipa LoginLock.dylib "iPhone Distribution: Your Name (TEAMID)" MyApp.mobileprovision Patched.ipa
#
# For jailbroken devices (no Apple cert needed), pass "adhoc" as identity:
#   ./inject_sign.sh MyApp.ipa LoginLock.dylib adhoc "" Patched.ipa
set -euo pipefail

IPA="${1:-}"
DYLIB="${2:-}"
IDENTITY="${3:-}"
PROV="${4:-}"
OUT="${5:-patched.ipa}"

# ── VALIDATE ARGS ─────────────────────────────────────────────────────────────
if [[ -z "$IPA" || -z "$DYLIB" || -z "$IDENTITY" ]]; then
  echo "Usage: $0 <input.ipa> <your.dylib> <signing-identity|adhoc> [provisioning.mobileprovision] [output.ipa]"
  echo ""
  echo "  signing-identity  Your codesign identity string, e.g.:"
  echo "                    \"iPhone Distribution: Company Name (TEAMID)\""
  echo "                    Pass \"adhoc\" for jailbroken-only (no Apple cert needed)"
  echo "  provisioning      Path to .mobileprovision file (required for real devices)"
  echo "                    Omit or pass empty string for adhoc/jailbroken"
  exit 1
fi

[[ -f "$IPA" ]]   || { echo "ERROR: IPA not found: $IPA";   exit 1; }
[[ -f "$DYLIB" ]] || { echo "ERROR: dylib not found: $DYLIB"; exit 1; }

# ── CHECK REQUIRED TOOLS ──────────────────────────────────────────────────────
MISSING=()
for tool in unzip zip codesign; do
  command -v "$tool" &>/dev/null || MISSING+=("$tool")
done

INJECT_TOOL=""
if command -v insert_dylib &>/dev/null; then
  INJECT_TOOL="insert_dylib"
elif command -v optool &>/dev/null; then
  INJECT_TOOL="optool"
fi

if [[ "${#MISSING[@]}" -gt 0 ]]; then
  echo "ERROR: Missing tools: ${MISSING[*]}"
  echo "  - codesign/unzip/zip are standard macOS tools"
  exit 1
fi

if [[ -z "$INJECT_TOOL" ]]; then
  echo "No injection tool found. Installing insert_dylib via Homebrew..."
  if command -v brew &>/dev/null; then
    brew install insert_dylib 2>/dev/null || {
      echo "Homebrew install failed. Building from source..."
      _TMP=$(mktemp -d)
      git clone --depth 1 https://github.com/Tyilo/insert_dylib "$_TMP/insert_dylib"
      pushd "$_TMP/insert_dylib" >/dev/null
      xcodebuild -scheme insert_dylib -configuration Release \
        SYMROOT="$_TMP/build" build -quiet
      sudo cp "$_TMP/build/Release/insert_dylib" /usr/local/bin/
      popd >/dev/null
      rm -rf "$_TMP"
    }
  else
    echo "Homebrew not found. Install it first: https://brew.sh"
    echo "Or install insert_dylib manually: https://github.com/Tyilo/insert_dylib"
    exit 1
  fi
  INJECT_TOOL="insert_dylib"
fi

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

# ── EXTRACT IPA ───────────────────────────────────────────────────────────────
echo "→ [1/5] Extracting IPA..."
unzip -q "$IPA" -d "$WORKDIR/extracted"

APP=$(find "$WORKDIR/extracted/Payload" -maxdepth 1 -name "*.app" | head -1)
[[ -z "$APP" ]] && { echo "ERROR: No .app bundle found in IPA Payload/"; exit 1; }

APP_NAME=$(basename "$APP" .app)
BINARY="$APP/$APP_NAME"

[[ -f "$BINARY" ]] || { echo "ERROR: Main binary not found at $BINARY"; exit 1; }

echo "   App bundle : $APP_NAME"
echo "   Binary     : $BINARY"

# ── COPY DYLIB INTO BUNDLE ────────────────────────────────────────────────────
echo "→ [2/5] Copying dylib into app bundle..."
mkdir -p "$APP/Frameworks"
DYLIB_NAME=$(basename "$DYLIB")
cp "$DYLIB" "$APP/Frameworks/$DYLIB_NAME"

# ── INJECT LOAD COMMAND ───────────────────────────────────────────────────────
echo "→ [3/5] Injecting LC_LOAD_DYLIB load command..."
DYLIB_RPATH="@executable_path/Frameworks/$DYLIB_NAME"

if [[ "$INJECT_TOOL" == "insert_dylib" ]]; then
  insert_dylib --strip-codesig --inplace "$DYLIB_RPATH" "$BINARY"
elif [[ "$INJECT_TOOL" == "optool" ]]; then
  optool install -c load -p "$DYLIB_RPATH" -t "$BINARY"
fi

echo "   Load path  : $DYLIB_RPATH"

# ── HANDLE PROVISIONING PROFILE ───────────────────────────────────────────────
ENTITLEMENTS_FILE=""
if [[ -n "$PROV" && -f "$PROV" ]]; then
  echo "→ [4/5] Embedding provisioning profile & extracting entitlements..."
  cp "$PROV" "$APP/embedded.mobileprovision"
  ENTITLEMENTS_FILE="$WORKDIR/entitlements.plist"
  security cms -D -i "$PROV" | \
    /usr/libexec/PlistBuddy -x -c "Print :Entitlements" /dev/stdin \
    > "$ENTITLEMENTS_FILE" 2>/dev/null || {
      # Fallback: use plutil
      security cms -D -i "$PROV" > "$WORKDIR/decoded.plist"
      plutil -extract Entitlements xml1 -o "$ENTITLEMENTS_FILE" "$WORKDIR/decoded.plist"
    }
  echo "   Entitlements extracted."
else
  echo "→ [4/5] No provisioning profile — signing without entitlements..."
fi

# ── RE-SIGN ───────────────────────────────────────────────────────────────────
SIGN_ID="$IDENTITY"
[[ "$IDENTITY" == "adhoc" ]] && SIGN_ID="-"

# Sign the injected dylib first
echo "   Signing injected dylib..."
codesign --force --sign "$SIGN_ID" "$APP/Frameworks/$DYLIB_NAME"

# Sign all other frameworks/dylibs in bundle
find "$APP/Frameworks" \( -name "*.framework" -o -name "*.dylib" -o -name "*.appex" \) | \
while read -r f; do
  [[ "$f" == "$APP/Frameworks/$DYLIB_NAME" ]] && continue
  echo "   Signing: $(basename "$f")"
  codesign --force --sign "$SIGN_ID" "$f"
done

# Sign the main app bundle
echo "   Signing app bundle..."
if [[ -n "$ENTITLEMENTS_FILE" ]]; then
  codesign --force --sign "$SIGN_ID" \
    --entitlements "$ENTITLEMENTS_FILE" \
    --timestamp=none "$APP"
else
  codesign --force --sign "$SIGN_ID" --timestamp=none "$APP"
fi

# ── REPACK AS IPA ─────────────────────────────────────────────────────────────
echo "→ [5/5] Repacking as IPA..."
pushd "$WORKDIR/extracted" >/dev/null
zip -qr "$OLDPWD/$OUT" Payload/
popd >/dev/null

echo ""
echo "✓ Done! Output: $OUT"
echo ""
echo "Verify signature:"
echo "  codesign -dvvv \"$APP_NAME\""
echo ""
echo "Sideload with:"
echo "  ideviceinstaller -i \"$OUT\"   (via libimobiledevice)"
echo "  or drag into Xcode Devices window"
