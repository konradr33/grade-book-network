export CC_NAME="grade-book";
export CC_LANGUAGE="typescript";
export CC_PATH="$PWD/grade-book-chaincode";


cd ./test-network || exit

export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051


sudo rm -rf organizations/fabric-ca/ordererOrg
sudo rm -rf organizations/fabric-ca/org1
sudo rm -rf organizations/fabric-ca/org2
sudo rm -rf organizations/ordererOrganizations
sudo rm -rf organizations/peerOrganizations
sudo rm -rf system-genesis-block


./network.sh down
./network.sh up -ca
./network.sh createChannel
./network.sh deployCC -ccn $CC_NAME -ccl $CC_LANGUAGE -ccp "$CC_PATH"
cp organizations/peerOrganizations/org1.example.com/connection-org1.json ../grade-book-application/assets/connection-config.json

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C mychannel -n grade-book --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"InitLedger","Args":[]}'
