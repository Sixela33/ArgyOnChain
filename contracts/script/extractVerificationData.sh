#!/bin/bash
cd "$(dirname "$0")/.."

# Get full solc version (e.g. 0.8.30+commit.73712a01)
SOLC_BIN=$(find ~/.local/share/svm -name "solc-0.8.30" 2>/dev/null | head -1)
if [ -z "$SOLC_BIN" ]; then
  SOLC_BIN=$(which solc 2>/dev/null)
fi

if [ -z "$SOLC_BIN" ]; then
  echo "ERROR: solc binary not found"
  exit 1
fi

SOLC_FULL=$("$SOLC_BIN" --version | grep "Version:" | awk '{print $2}' | cut -d. -f1-4 | sed 's/+commit\.\([a-f0-9]*\).*/+commit.\1/')

echo "Using solc: $SOLC_FULL"

python3 - "$SOLC_FULL" <<'EOF'
import json, os, glob, sys

solc_long = sys.argv[1]

best = None
best_mtime = 0

for path in glob.glob("out/build-info/*.json"):
    with open(path) as f:
        d = json.load(f)
    sources = d.get("input", {}).get("sources", {})
    # Exclude script build-infos: they also include src/Token.sol (via imports)
    # but additionally contain forge-std sources which Snowtrace doesn't need.
    # Exclude script build-infos (forge script runs): they contain script/ sources
    # and use a different compilation unit than the one that produced the deployed bytecode.
    is_contract_build = "src/Token.sol" in sources and not any(s.startswith("script/") for s in sources)
    if is_contract_build:
        mtime = os.path.getmtime(path)
        if mtime > best_mtime:
            best = d
            best_mtime = mtime

if not best:
    print("ERROR: no build-info file with src/Token.sol found")
    exit(1)

out = { "input": best["input"], "solcLongVersion": solc_long }
json.dump(out, open("../frontend/src/lib/tokenVerification.json", "w"))
print(f"Extracted verification data (solc {solc_long})")
EOF
