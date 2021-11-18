// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract TenancyDeposit {

  address public owner = msg.sender;
  address public landlord;
  address payable public tenant;
  address public adjudicator;
  uint public depositRequired;
  uint public depositPaid;
  uint public amountToRefund;
  bool public isDepositPaid;
  bool public isDepositReturned;

  event LogRequiredDepositSet(uint depositRequired);
  event LogDepositPaid(address indexed tenant, uint depositAmount);
  event LogDepositReturned(address indexed landlord, address indexed tenant, uint returnedAmount);

   modifier ownerOnly() {
    require(msg.sender == owner, "Action can only be performed by contract owner");
    _;
  }
  modifier tenantOnly() {
    require(msg.sender == tenant, "Action can only be performed by a tenant");
    _;
  }

  modifier landlordOnly() {
    require(msg.sender == landlord, "Action can only be performed by a landlord");
    _;
  }

  modifier adjudicatorOnly() {
    require(msg.sender == adjudicator, "Action can only be performed by an adjudicator");
    _;
  }

  modifier depositIsPaid() {
    require(isDepositPaid, "Deposit is currently unpaid");
    _;
  }

  modifier depositIsUnpaid() {
    require(!isDepositPaid, "Deposit has already been paid");
    _;
  }

   modifier paidEnoughDeposit() { 
    require(msg.value >= depositRequired, "amount paid is less than required deposit amount"); 
    _;
  }

  modifier checkDepositAmount() {
    _;
    amountToRefund = msg.value - depositRequired;
    if (amountToRefund > 0) {
      (bool success, ) = tenant.call.value(amountToRefund)("");
      require(success, "Transfer failed.");
    }
  }

  modifier depositIsReturned() {
    require(isDepositReturned, "Deposit has not been returned to the tenant");
    _;
  }

  modifier depositIsUnreturned() {
    require(!isDepositReturned, "Deposit has already been returned to the tenant");
    _;
  }

    constructor() public{}

  function setLandlordAddress(address _landlord) public ownerOnly {
      landlord = _landlord;
  }

  function setAdjudicatorAddress(address _adjudicator) public ownerOnly {
    adjudicator = _adjudicator;
  }
  function setTenantAddress(address payable _tenant) public landlordOnly {
    tenant = _tenant;
  }

  function setDepositRequired(uint _depositRequired) public landlordOnly {
    depositRequired = _depositRequired;
    emit LogRequiredDepositSet( _depositRequired);
  }

  function payDeposit() public payable tenantOnly depositIsUnpaid paidEnoughDeposit checkDepositAmount returns (bool) {
    depositPaid = depositRequired;
    emit LogDepositPaid(msg.sender, depositRequired);
    return isDepositPaid = true;
  }

  function returnDeposit() public landlordOnly depositIsPaid depositIsUnreturned { // Not robust
      uint depositToReturn = depositPaid;
      depositPaid = 0;
      isDepositReturned = true;
      (bool success, ) = tenant.call.value(depositToReturn)("");
      require(success, "Transfer failed.");
      emit LogDepositReturned(landlord, tenant, depositToReturn);
  }
}