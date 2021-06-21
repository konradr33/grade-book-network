# Grade Book Network

# Installation

Fill [Hyperledger Fabric network requirements](https://hyperledger-fabric.readthedocs.io/en/latest/install.html).

After downloading this repository, load the child's repositories

```bash
git submodule update --init --recursive
```

Run starting script
```bash
./start.sh
```

It initializes blockchain network, deploys [grade-book-chaincode](https://github.com/konradr33/grade-book-chaincode), copies network configuration into [Grade Book Application](https://github.com/konradr33/grade-book-application).

## License <a name="license"></a>

Hyperledger Project source code files are made available under the Apache
License, Version 2.0 (Apache-2.0), located in the [LICENSE](LICENSE) file.
Hyperledger Project documentation files are made available under the Creative
Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.
