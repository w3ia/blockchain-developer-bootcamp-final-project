// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TenancyDeposit is ReentrancyGuard {

  address payable public landlord;
  uint[] internal properties;

  enum AgreementState { Empty, Created, Active, Released, Ended }

  struct Deposit { 
    uint propertyId;
    address landlord;
    address payable tenant;
    uint depositAmount;
    uint deductions;
    uint returnAmount;
    AgreementState agreementState;
  }

  mapping(uint => Deposit) internal depositByProperty;
  mapping(uint => address) internal tenantByProperty;

  event DepositAgreementCreated(address landlord, uint propertyId, uint depositAmount, address tenant, uint agreementState);
  event DepositPaid(address tenant, uint propertyId, uint depositAmount, uint agreementState);
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
    require(address(landlord).balance >= depositByProperty[_propertyId].depositAmount, "Contract balance is less than deposit amount"); 
    _;
  }

  constructor() {
    landlord = payable(msg.sender);
  }

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

  function approveDepositReturn(uint _propertyId, uint _deductions) external landlordOnly enoughDepositBalance(_propertyId) returns(uint) {
    require(depositByProperty[_propertyId].agreementState == AgreementState.Active, 
    "Agreement is not active, there is no deposit return to approve");

    require(depositByProperty[_propertyId].depositAmount >= _deductions, "Deductions cannot be greater than deposit amount");

    depositByProperty[_propertyId].agreementState = AgreementState.Released;
    depositByProperty[_propertyId].deductions = _deductions;
    depositByProperty[_propertyId].returnAmount = depositByProperty[_propertyId].depositAmount - _deductions;

    return depositByProperty[_propertyId].returnAmount;
  }

  function withdrawDeposit(uint _propertyId) external tenantOnly(_propertyId) enoughDepositBalance(_propertyId) nonReentrant {
     require(depositByProperty[_propertyId].agreementState == AgreementState.Released, 
    "Deposit is not released. Please check agreement state.");

    depositByProperty[_propertyId].agreementState = AgreementState.Ended;
    (bool sent, ) = depositByProperty[_propertyId].tenant.call{ value: depositByProperty[_propertyId].returnAmount }("");
      require(sent, "Deposit return failed.");
    emit DepositReturned(landlord, _propertyId, depositByProperty[_propertyId].returnAmount,depositByProperty[_propertyId].tenant, uint(depositByProperty[_propertyId].agreementState));
  }

  function getDeposit(uint _propertyId) external view returns(Deposit memory) {
    require(depositByProperty[_propertyId].agreementState != AgreementState.Empty, "No deposit agreement exists for given address");
    return depositByProperty[_propertyId];
  }
  
  function getPropertyIds() external view returns(uint[] memory) {
    require(properties.length > 0, "No properties exist");
    return properties;
  }

  function depositBalances() external view landlordOnly returns(uint) {
    return uint(address(this).balance);
  }
  
  receive() external payable {
  }
}