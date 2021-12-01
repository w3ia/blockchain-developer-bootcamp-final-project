## Avoiding Common Attacks

* Proper setting of visibility for functions - [SWC-100](https://swcregistry.io/docs/SWC-100).
* Proper setting of visibility for state variables [SWC-108](https://swcregistry.io/docs/SWC-108).
* Using a specific pragma compile - Solidity 0.8.0 is used and not floating pragma - [SWC-103](https://swcregistry.io/docs/SWC-103).
* Low-level call return value is checked to handle the possibility that the call might fail - [SWC-104](https://swcregistry.io/docs/SWC-104).
* Use ``require`` to check sender's balances and allowances, where applicable.
* Use checks-effects-interactions in the ``payDeposit`` and ``withdrawDeposit`` functions - [SWC-107](https://swcregistry.io/docs/SWC-107).
* Use Openzeppelin's [ReentrancyGuard](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/security/ReentrancyGuard.sol) to safeguard against reentrancy attack - [SWC-107](https://swcregistry.io/docs/SWC-107).
* "Pull over Push" method for deposit withdrawals via the``releaseDeposit`` and ``withdrawDeposit`` functions.
* Using modifiers to perform validation e.g. Ensuring the message sender has the correct "role" or ensuring the contract balance is enough before approving or allowing deposit withdrawls.
