// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title Simple Tenancy Deposit
/// @author w3ia.x
/// @notice Contract for exchanging of deposits between tenants and landlords.

contract TenancyDeposit is ReentrancyGuard {

  address payable public landlord;

  uint[] internal properties;


  ///@notice Used for tracking the state of a deposit agreement
  ///@dev used to ensure a given function cannot execute if a deposit agreement is not in the correct state
  enum AgreementState { Empty, Created, Active, Released, Ended }

  ///@notice Represents the deposit agreement between landlord and tenants.
  struct Deposit { 
    uint propertyId;
    address landlord;
    address payable tenant;
    uint depositAmount;
    uint deductions;
    uint returnAmount;
    AgreementState agreementState;
  }
  // Stores all deposits by the associated property
  mapping(uint => Deposit) internal depositByProperty;

  // Stores properties that have paid deposits
  // Used for the tenantOnly modifier to ensure the msg.sender as a paid tenant
  mapping(uint => address) internal tenantByProperty;

  /// @notice Emitted when landlord created a skeleton agreement for a property
  /// @param landlord Landlord's address
  /// @param propertyId ID of property
  /// @param depositAmount The required deposit for the given property
  /// @param tenant Tenant address - will be address(0) on creation
  /// @param agreementState Tracks the given state of the agreement during its lifetime
  event DepositAgreementCreated(address landlord, uint propertyId, uint depositAmount, address tenant, uint agreementState);

  /// @notice Emitted when tenant pays deposit for a property
  /// @param tenant Tenant address
  /// @param propertyId ID of property.
  /// @param depositAmount The required deposit for the given property.
  /// @param agreementState Tracks the given state of the agreement during its lifetime.
  event DepositPaid(address tenant, uint propertyId, uint depositAmount, uint agreementState);

  /// @notice Emitted when tenant withdraws deposit for a property
  /// @param landlord Landlord's address
  /// @param propertyId ID of property.
  /// @param returnedAmount The amount of deposit returned to tenant
  /// @param agreementState Tracks the given state of the agreement during its lifetime.
  event DepositReturned(address landlord, uint propertyId, uint returnedAmount, address tenant, uint agreementState);

  modifier landlordOnly() {
    require(msg.sender == landlord, "Action can only be performed by a landlord");
    _;
  }

  modifier tenantOnly(uint _propertyId) {
    require(tenantByProperty[_propertyId] == msg.sender, "Tenant has not paid deposit for this property");
    _;
  }

  modifier enoughDepositBalance(uint _propertyId) {
    require(address(this).balance >= depositByProperty[_propertyId].depositAmount, "Contract balance is less than deposit amount"); 
    _;
  }

  constructor() {
    landlord = payable(msg.sender);
  }

  /// @notice Creates a new deposit agreement
  /// @param _propertyId ID of property.
  /// @param _depositAmount The required deposit
  /// @dev landlordOnly and reverts if agreement for given propertyId already exists.
  function createDepositAgreement(uint _propertyId, uint _depositAmount) external landlordOnly {
    require(depositByProperty[_propertyId].agreementState != AgreementState.Active,
    "Active deposit agreement for given property already exists");

      depositByProperty[_propertyId] = Deposit({
        propertyId: _propertyId,
        landlord: landlord,
        tenant: payable(address(0)),
        depositAmount: _depositAmount,
        deductions: 0,
        returnAmount: 0,
        agreementState: AgreementState.Created
      });

    properties.push(_propertyId);

    emit DepositAgreementCreated(msg.sender, _propertyId, _depositAmount, address(0), uint(depositByProperty[_propertyId].agreementState));
  }

  /// @notice Allows tenant to pay the required deposit for a property
  /// @param _propertyId ID of property.
  /// @dev payable function that reverts if msg.value != Deposit.depositAmount
  function payDeposit(uint _propertyId) external payable nonReentrant {
    require(depositByProperty[_propertyId].agreementState == AgreementState.Created, 
    "Agreement is either active or ended, cannot accept deposit payment");

    require(landlord != msg.sender,
    "Deposit cannot be paid by landlord");

    require(depositByProperty[_propertyId].depositAmount == msg.value, 
    "Please pay exact deposit amount");
    
    tenantByProperty[_propertyId] = msg.sender;

    depositByProperty[_propertyId].tenant = payable(msg.sender);
    depositByProperty[_propertyId].agreementState = AgreementState.Active;

    (bool sent, ) = address(this).call{ value: msg.value }("");
      require(sent, "Deposit payment failed.");
      
    emit DepositPaid(depositByProperty[_propertyId].tenant, _propertyId, depositByProperty[_propertyId].depositAmount, uint(depositByProperty[_propertyId].agreementState));
  }

  /// @notice Allows landlord to set deposit deductions at the end of an agreement and approve deposit return
  /// @param _propertyId ID of property.
  /// @param _deductions How much will be deducted from the deposit (can be 0)
  /// @dev landlordOnly function that will revert if contract balance < return amount or if agreementState != active
  function approveDepositReturn(uint _propertyId, uint _deductions) external landlordOnly enoughDepositBalance(_propertyId) returns(uint) {
    require(depositByProperty[_propertyId].agreementState == AgreementState.Active, 
    "Agreement is not active, there is no deposit return to approve");

    require(depositByProperty[_propertyId].depositAmount >= _deductions, "Deductions cannot be greater than deposit amount");

    depositByProperty[_propertyId].agreementState = AgreementState.Released;
    depositByProperty[_propertyId].deductions = _deductions;
    depositByProperty[_propertyId].returnAmount = depositByProperty[_propertyId].depositAmount - _deductions;

    return depositByProperty[_propertyId].returnAmount;
  }

  /// @notice Allows tenant to withdraw a released deposit
  /// @param _propertyId ID of property
  /// @dev tenantOnly function that will revert if contract balance < return amount or if agreementState != released
  function withdrawDeposit(uint _propertyId) external tenantOnly(_propertyId) enoughDepositBalance(_propertyId) nonReentrant {
     require(depositByProperty[_propertyId].agreementState == AgreementState.Released, 
    "Deposit is not released. Please check agreement state.");

    depositByProperty[_propertyId].agreementState = AgreementState.Ended;
    (bool sent, ) = depositByProperty[_propertyId].tenant.call{ value: depositByProperty[_propertyId].returnAmount }("");
      require(sent, "Deposit return failed.");
    emit DepositReturned(landlord, _propertyId, depositByProperty[_propertyId].returnAmount,depositByProperty[_propertyId].tenant, uint(depositByProperty[_propertyId].agreementState));
  }

  /// @notice Returns deposit for given property
  /// @param _propertyId ID of property
  /// @dev Utility function for front-end, returns Deposit at the given propertyId
  function getDeposit(uint _propertyId) external view returns(Deposit memory) {
    require(depositByProperty[_propertyId].agreementState != AgreementState.Empty, "No deposit agreement exists for given address");
    return depositByProperty[_propertyId];
  }

  /// @notice Returns list of all propertyIds that have an existing agreement
  /// @dev Utility function for front-end, returns array of propertyIds that can be looped in the front-end rather than in contract
  function getPropertyIds() external view returns(uint[] memory) {
    require(properties.length > 0, "No properties exist");
    return properties;
  }

  /// @notice Returns full contract balance
  /// @dev landlordOnly utility function for front-end, returns full contract balance.
  function depositBalances() external view landlordOnly returns(uint) {
    return uint(address(this).balance);
  }
  
  /// @dev fallback receive function so that contract can accept eth.
  receive() external payable {
  }
}