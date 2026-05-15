# This script moves the json files to the build folder to be used by the frontend

echo "Current directory: $(pwd)"

cd "$(dirname "$0")"

# Getting absolute path to the backend directory
backend_dir="../../backend/src/ethereum/abis"

# Create the abis directory if it doesn't exist
mkdir -p $backend_dir

# Copying the files to the backend directory
cp ../out/TokenFactory.sol/TokenFactory.json $backend_dir/TokenFactory.json
cp ../out/IdentityFactory.sol/IdentityFactory.json $backend_dir/IdentityFactory.json
cp ../out/Identity.sol/Identity.json $backend_dir/Identity.json
cp ../out/Token.sol/Token.json $backend_dir/Token.json
cp ../out/Identity.sol/Identity.json $backend_dir/Identity.json
cp ../out/ClaimIssuerManager.sol/ClaimIssuerManager.json $backend_dir/ClaimIssuerManager.json
cp ../out/mocKUSDC.sol/USDC.json $backend_dir/USDC.json


echo "All contract JSON files moved successfully to the backend directory!"

frontend_dir="../../frontend/src/lib/abis"

# Create the abis directory if it doesn't exist
mkdir -p $frontend_dir

# Copying the files to the frontend directory
cp ../out/TokenFactory.sol/TokenFactory.json $frontend_dir/TokenFactory.json
cp ../out/Token.sol/Token.json $frontend_dir/Token.json
cp ../out/mocKUSDC.sol/USDC.json $frontend_dir/USDC.json

echo "All contract JSON files moved successfully to the frontend directory!"