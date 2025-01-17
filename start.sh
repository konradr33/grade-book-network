export CC_NAME="grade-book";
export CC_LANGUAGE="typescript";
export CC_CHANNEL="grade-book-channel";
export CC_PATH="$PWD/grade-book-chaincode";


cd ./test-network || exit

sudo rm -rf channel-artifacts/
sudo rm -rf organizations/fabric-ca/ordererOrg
sudo rm -rf organizations/fabric-ca/ordererOrg
sudo rm -rf organizations/fabric-ca/org1
sudo rm -rf organizations/fabric-ca/org2
sudo rm -rf organizations/ordererOrganizations
sudo rm -rf organizations/peerOrganizations
sudo rm -rf system-genesis-block


./network.sh down
./network.sh up -ca
./network.sh createChannel -c $CC_CHANNEL
./network.sh deployCC -ccn $CC_NAME -ccl $CC_LANGUAGE -ccp "$CC_PATH" -c $CC_CHANNEL -cci InitLedger -cccg "$CC_PATH"/collections_config.json

cp organizations/peerOrganizations/org1.example.com/connection-org1.json ../grade-book-application/assets/connection-config.json
