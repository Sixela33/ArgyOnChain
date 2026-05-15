# This script moves the json files to the build folder to be used by the frontend

echo "Current directory: $(pwd)"

cd "$(dirname "$0")"

frontend_dir="../../frontend/src/lib/abis"

# Create the abis directory if it doesn't exist
mkdir -p $frontend_dir

# Copying the files to the frontend directory
cp ../out/TokenFactory.sol/TokenFactory.json $frontend_dir/TokenFactory.json
cp ../out/Token.sol/Token.json $frontend_dir/Token.json
cp ../out/mocKUSDC.sol/USDC.json $frontend_dir/USDC.json

echo "All contract JSON files moved successfully to the frontend directory!"