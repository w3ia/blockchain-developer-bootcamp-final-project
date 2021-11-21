// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TenancyDeposit.sol";

contract TenancyDepositManager {

    mapping(uint => TenancyDeposit) depositByProperty;
 
    event NewTenancyDeposit(address indexed tenancyDeposit, address indexed landlord, address indexed tenant);

     modifier noActiveDeposit(uint _propertyId) {
        require(depositByProperty[_propertyId].isAgreementActive() != true, 
        "Active tenancy deposit for given property already exists");
        _;
    }

    function createTenancyDeposit(address _tenant, address _adjudicator, uint _propertyId, uint _depositRequired) 
    public noActiveDeposit(_propertyId) {
        TenancyDeposit tenancyDeposit =
            new TenancyDeposit(msg.sender, _tenant, _adjudicator, _propertyId, _depositRequired);
        emit NewTenancyDeposit(address(tenancyDeposit), msg.sender, _tenant);
        depositByProperty[_propertyId] = tenancyDeposit;
    }
}