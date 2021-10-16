# **TenancyDeposit** Contract Design **v0.1** **WIP**
### **State Variables**
---

*// Landlord's address (landlord is owner)*
* address payable **landlordAddress**;

*// Tenant's address*
* address payable **tenantAddress**;

*// Adjudicator's address*
* address **adjudicator**;
---
*// The unqiue ID of the deposit*
* uint public **depositId**;

*// The length of the tenancy agreement*
* uint public **tenancyStartDate**;
* uint public **tenancyEndDate**;

*// Total deposit required for given tenancy*
* uint public **depositRequired**;

*// Total amount of deposit paid*
* uint public **depositPaid**

*// Has the full deposit payment been made?*
* bool public **isFullyPaid**;

*// Has a partial deposit payment been made?*
* bool public **isPartialPaid**;
---
*// How much the lanlord proposes to deduct from **depositMade***
* uint public **proposedDeductions**;

*// How much both landlord and tenant agree to deduct from **depositMade***
* uint public **agreedDeductions**;

*// Is **proposedDeductions** being disputed?*
* bool public **isDisputed**;

*// How much of **depositMade** is being disputed.*
* uint public **disputedAmount**;

*// Is dispute resolved?*
* boo public **isResolved**;

*// How much of **depositMade** has been agreed for return.*
* uint public **agreedReturnAmount**;

*// Tenant struct*
* struct **tenant** { address **tenantAddress**; string **propertyAddress**; storagedepositId **depositId**; depositPaymentState **depositPaymentState**; } 

---
*// Deposit states*
* enum depositPaymentState {
    Unpaid, 
    PartPaid, 
    FullyPaid, 
    PartReturned, 
    FullyReturned
  }

*// Tenancy states*
* enum tenancyState {
    tenancyActive,
    tenancyEnded
  }

*// Dispute states*
* enum disputeState {
    undisupted,
    disputed
  }
---
### **Events**
event partialPaymentMade();
event fullPaymentMade();
event depositIdGenerated();
event agreementEnded();
event agreementRenewed();
Event disupteRaised();
Event disputeResolved();
Event depositReleased();

---
### **Modifiers**
* modifier **isTenant**()
  * require(msg.sender == tenant)
* modifier **isLandlord**()
  * require(msg.sender == landlord)
* modifier **isAjudicator**()
  * require(msg.sender == adjudicator)
* modifier **isUnpaid**()
  * require(DepositPaymentState.Unpaid AND depositPaid < depositRequired)
* modifier **PartPaid**()
  * require(DepositPaymentState.PartPaid AND (depositPaid > 0 AND depositPaid < depositRequired)

* modifier **fullPaid**()
  * require(DepositPaymentState.FullyPaid AND (depositPaid = depositRequired)

*//Other State Modifiers - assume modifier to check each state*
  
  ### **Functions**
function **depositPartial()** public payable isTenant() tenancyActive() isUndisputed() isUnpaid {}

function **depositFull()** public payable isTenant() tenancyActive() isUndisputed() isUnpaid {}

function **returnfullDeposit()** public isLandlord() tenancyEnded() isUndisputed() isPaid() {}

function **returnPartDeposit()** public isLandlord() tenancyEnded() isUndisputed() isPaid() {}

function **endAgreement()** public isLandlord() tenancyActive() {}

function **renewAgreement()** public isLandlord() tenancyEnded() {}

function **notariseDeposit()** public isLandlord() tenancyActive() isUndisputed() isPaid() {}

function **raiseDispute()** public isTenant isPaid() tenancyEnded() {}

function **resolveDispute()** public isAdjudicator() isDisputed() isPaid() {}

function **returnDisputedDeposit()** public isAdjudicator() disputeResolved() {}





