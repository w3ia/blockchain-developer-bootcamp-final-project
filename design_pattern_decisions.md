## Design Patterns

### Access Control Design Patterns
Access to key functions is controlled by "role" modifiers e.g. Only a "Landlord" can create new agreements (`createDepositAgreement` function) or release deposits (`releaseDeposit` function ) and only a "Tenant" can pay (`payDeposit` function) or withdraw a deposit (`withdrawDeposit` function).
  

### Inheritance and Interfaces
Inherits from Openzeppelin's ReentrancyGuard and applies nonReentrant modifer to `payDeposit` and `withdrawDeposit` functions.

### Optimizing Gas
Contract implementation has attempted to optmize gas usage by:
* Avoiding the usage of loops within functions.
* Using `uint256` as much as possible e.g. Using alias `uint` instead of `string` for property details/Id.
* Having explicit function visibility e.g. Marking functions `external`.
