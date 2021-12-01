const  TenancyDeposit = artifacts.require("TenancyDeposit");
const { catchRevert } = require("./exceptionsHelpers.js");
const { Console } = require('console');
const BigNumber = require('bignumber.js');

// Set to true for gas estimation output
let estimateGas = false;
let amountOfGas = 0;

contract("TenancyDeposit", function (accounts) {
  const [landlord, tenantAlice, tenantBob] = accounts;

  const agreementState = {
    CREATED: "1",
    ACTIVE: "2",
    RELEASED: "3",
    ENDED: "4"
  }

  const propertyOneId = "10";
  const propertyOneDeposit = web3.utils.toWei('0.5', 'ether');
  const PropertyOneFullDeposit = propertyOneDeposit;
  const propertyOneDeductions = web3.utils.toWei('0.1', 'ether');

  const propertyTwoId = "20";
  const propertyTwoDeposit = web3.utils.toWei('1', 'ether');
  const PropertyTwoFullDeposit = propertyTwoDeposit;
  const propertyTwoDeductions = web3.utils.toWei('0.5', 'ether');

  const incorrectDeposit = web3.utils.toWei('0.1', 'ether');
  const overDeductions = web3.utils.toWei('2', 'ether');
  const zeroDeductions = web3.utils.toWei('0', 'ether');
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  let tenancyDeposit;

  beforeEach(async () => {
    tenancyDeposit = await TenancyDeposit.new();
  });

  it("has correct landlord/owner", async () => {
    expect(await tenancyDeposit.landlord.call()).to.equal(landlord);
  });

  describe("Deposit agreement - creation", () => {

    it("should log a DepositAgreementCreated event when a deposit is successfully made", async () => {
      const expectedEventOneResult = { 
        propertyId: propertyOneId,
        tenantAddress: zeroAddress,  
        depositAmount: propertyOneDeposit, 
        agreementState: agreementState.CREATED
      };

      if(estimateGas) {
        amountOfGas = await tenancyDeposit.createDepositAgreement.estimateGas(propertyOneId, propertyOneDeposit, { from: landlord });
        console.log("amountOfGas for createDepositAgreement: ", amountOfGas);
      }

      const resultOne = await tenancyDeposit.createDepositAgreement(propertyOneId, propertyOneDeposit, { from: landlord });
      expect(resultOne.logs[0].args.landlord).to.equal(landlord);
      expect(resultOne.logs[0].args.propertyId.toString()).to.equal(expectedEventOneResult.propertyId);
      expect(resultOne.logs[0].args.depositAmount.toString()).to.equal(expectedEventOneResult.depositAmount);
      expect(resultOne.logs[0].args.tenant).to.equal(expectedEventOneResult.tenantAddress);
      expect(resultOne.logs[0].args.agreementState.toString()).to.equal(expectedEventOneResult.agreementState);

      const expectedEventTwoResult = { 
        propertyId: propertyTwoId,
        tenantAddress: zeroAddress,  
        depositAmount: propertyTwoDeposit, 
        agreementState: agreementState.CREATED
      };

      const resultTwo = await tenancyDeposit.createDepositAgreement(propertyTwoId, propertyTwoDeposit, { from: landlord });
      expect(resultTwo.logs[0].args.landlord).to.equal(landlord);
      expect(resultTwo.logs[0].args.propertyId.toString()).to.equal(expectedEventTwoResult.propertyId);
      expect(resultTwo.logs[0].args.depositAmount.toString()).to.equal(expectedEventTwoResult.depositAmount);
      expect(resultTwo.logs[0].args.tenant).to.equal(expectedEventTwoResult.tenantAddress);
      expect(resultTwo.logs[0].args.agreementState.toString()).to.equal(expectedEventTwoResult.agreementState);
    });

    it("should return existing deposit agreement for given property", async () => {
      const expectedEventTwoResult = { 
        propertyId: propertyTwoId,
        tenantAddress: zeroAddress,  
        depositAmount: propertyTwoDeposit, 
        agreementState: agreementState.CREATED
      };
  
      await tenancyDeposit.createDepositAgreement(propertyTwoId, propertyTwoDeposit, { from: landlord });

      if(estimateGas) {
        amountOfGas = await tenancyDeposit.getDeposit.estimateGas(propertyTwoId, { from: landlord });
        console.log("amountOfGas for getDeposit: ", amountOfGas);
      }
  
      const resultTwo = await tenancyDeposit.getDeposit(propertyTwoId, { from: landlord });
      expect(resultTwo.propertyId.toString()).to.equal(expectedEventTwoResult.propertyId);
      expect(resultTwo.tenant).to.equal(expectedEventTwoResult.tenantAddress);
      expect(resultTwo.depositAmount.toString()).to.equal(expectedEventTwoResult.depositAmount);
      expect(resultTwo.agreementState.toString()).to.equal(expectedEventTwoResult.agreementState);
    });

    it("should error if landlord tries to create agreement for property that already has an active agreement", async () => {
      await tenancyDeposit.createDepositAgreement(propertyOneId, propertyOneDeposit, { from: landlord });
      await tenancyDeposit.payDeposit(propertyOneId, { from: tenantAlice, value: PropertyOneFullDeposit });

      await catchRevert(tenancyDeposit.createDepositAgreement(propertyOneId, propertyOneDeposit, { from: landlord }));
    });

    it("should error if attempt is made to get a non-existing deposit agreement", async () => {
      await catchRevert(tenancyDeposit.getDeposit(propertyOneId, { from: landlord }));
     });
  });

  describe("Deposit agreement - payment", () => {

    it("should log a DepositPaid event when a deposit is successfully paid", async () => {
      const expectedEventOneResult = { 
        tenantAddress: tenantAlice,
        propertyId: propertyOneId,  
        depositAmount: propertyOneDeposit, 
        agreementState: agreementState.ACTIVE
      };
      
      await tenancyDeposit.createDepositAgreement(propertyOneId, propertyOneDeposit, { from: landlord });

      if(estimateGas) {
        amountOfGas = await tenancyDeposit.payDeposit.estimateGas(propertyOneId, { from: tenantAlice, value: PropertyOneFullDeposit });
        console.log("amountOfGas payDeposit: ", amountOfGas);
      }

      const resultOne = await tenancyDeposit.payDeposit(propertyOneId, { from: tenantAlice, value: PropertyOneFullDeposit });
      expect(resultOne.logs[0].args.tenant).to.equal(expectedEventOneResult.tenantAddress);
      expect(resultOne.logs[0].args.propertyId.toString()).to.equal(expectedEventOneResult.propertyId);
      expect(resultOne.logs[0].args.depositAmount.toString()).to.equal(expectedEventOneResult.depositAmount);
      expect(resultOne.logs[0].args.agreementState.toString()).to.equal(expectedEventOneResult.agreementState);


      const expectedEventTwoResult = { 
        tenantAddress: tenantBob,
        propertyId: propertyTwoId,  
        depositAmount: propertyTwoDeposit, 
        agreementState: agreementState.ACTIVE
      };
      
      await tenancyDeposit.createDepositAgreement(propertyTwoId, propertyTwoDeposit, { from: landlord });

      const resultTwo = await tenancyDeposit.payDeposit(propertyTwoId, { from: tenantBob, value: PropertyTwoFullDeposit });
      expect(resultTwo.logs[0].args.tenant).to.equal(expectedEventTwoResult.tenantAddress);
      expect(resultTwo.logs[0].args.propertyId.toString()).to.equal(expectedEventTwoResult.propertyId);
      expect(resultTwo.logs[0].args.depositAmount.toString()).to.equal(expectedEventTwoResult.depositAmount);
      expect(resultTwo.logs[0].args.agreementState.toString()).to.equal(expectedEventTwoResult.agreementState);
    });

    it("should error if deposit paid is less than deposit required", async () => {
      await tenancyDeposit.createDepositAgreement(propertyOneId, propertyOneDeposit, { from: landlord });
      await catchRevert(tenancyDeposit.payDeposit(propertyOneId, { from: tenantAlice, value: incorrectDeposit }));
    });

    it("should error if tenant tries to pay deposit for agreement that is not in created state", async () => {
      await catchRevert(tenancyDeposit.payDeposit(propertyOneId, { from: tenantAlice, value: PropertyOneFullDeposit }));
    });

    it("should error if tenant tries to pay deposit for agreement that is already active", async () => {
      await tenancyDeposit.createDepositAgreement(propertyOneId, propertyOneDeposit, { from: landlord });
      await tenancyDeposit.payDeposit(propertyOneId, { from: tenantAlice, value: PropertyOneFullDeposit });
      await catchRevert(tenancyDeposit.payDeposit(propertyOneId, { from: tenantAlice, value: PropertyOneFullDeposit }));
    });

    it("should error if landlord tries to pay deposit", async () => {
      await tenancyDeposit.createDepositAgreement(propertyOneId, propertyOneDeposit, { from: landlord });
      await catchRevert(tenancyDeposit.payDeposit(propertyOneId, { from: landlord, value: PropertyOneFullDeposit }));
    });
  });


  describe("Deposit agreement - release", () => {

    it("should return approved deposit amount when landlord successfully approves full deposit release", async () => {
      await tenancyDeposit.createDepositAgreement(propertyTwoId, propertyTwoDeposit, { from: landlord });
      await tenancyDeposit.payDeposit(propertyTwoId, { from: tenantBob, value: PropertyTwoFullDeposit });

      if(estimateGas) {
        amountOfGas = await tenancyDeposit.approveDepositReturn.estimateGas(propertyTwoId, zeroDeductions, { from: landlord});
        console.log("amountOfGas approveDepositReturn: ", amountOfGas);
      }

      await tenancyDeposit.approveDepositReturn(propertyTwoId, zeroDeductions, { from: landlord});

      const deposit = await tenancyDeposit.getDeposit(propertyTwoId, { from: landlord});
      expect(deposit.returnAmount.toString()).to.equal(PropertyTwoFullDeposit.toString());
      expect(deposit.agreementState.toString()).to.equal(agreementState.RELEASED);
    });

    it("should return approved deposit amount when landlord successfully approves part deposit release", async () => {
      await tenancyDeposit.createDepositAgreement(propertyTwoId, propertyTwoDeposit, { from: landlord });
      await tenancyDeposit.payDeposit(propertyTwoId, { from: tenantBob, value: PropertyTwoFullDeposit });
      await tenancyDeposit.approveDepositReturn(propertyTwoId, propertyTwoDeductions, { from: landlord});

      const deposit = await tenancyDeposit.getDeposit(propertyTwoId, { from: landlord});
      expect(deposit.returnAmount.toString()).to.equal(propertyTwoDeductions.toString());
      expect(deposit.agreementState.toString()).to.equal(agreementState.RELEASED);
    });

    it("should error if approved deductions are greater than deposit amount", async () => {
      await tenancyDeposit.createDepositAgreement(propertyTwoId, propertyTwoDeposit, { from: landlord });
      await tenancyDeposit.payDeposit(propertyTwoId, { from: tenantBob, value: PropertyTwoFullDeposit });
  
      await catchRevert(tenancyDeposit.approveDepositReturn(propertyTwoId, overDeductions, { from: landlord }));
    });

    it("should error if attempt is made by non-landlord to approve deposit return", async () => {
      await tenancyDeposit.createDepositAgreement(propertyTwoId, propertyTwoDeposit, { from: landlord });
      await tenancyDeposit.payDeposit(propertyTwoId, { from: tenantBob, value: PropertyTwoFullDeposit });
  
      await catchRevert(tenancyDeposit.approveDepositReturn(propertyTwoId, zeroDeductions, { from: tenantBob }));
    });

    it("should error if attempt is made to approve deposit release of non-paid agreement", async () => {
      await tenancyDeposit.createDepositAgreement(propertyTwoId, propertyTwoDeposit, { from: landlord });
      await catchRevert(tenancyDeposit.approveDepositReturn(propertyTwoId, zeroDeductions, { from: landlord }));
    });

    it("should error if attempt is made to re-release deposit that has already been released", async () => {
      await tenancyDeposit.createDepositAgreement(propertyTwoId, propertyTwoDeposit, { from: landlord });
      await tenancyDeposit.payDeposit(propertyTwoId, { from: tenantBob, value: PropertyTwoFullDeposit });
      await tenancyDeposit.approveDepositReturn(propertyTwoId, zeroDeductions, { from: landlord });

      await catchRevert(tenancyDeposit.approveDepositReturn(propertyTwoId, zeroDeductions, { from: landlord }));
    });
  });

  describe("Deposit agreement - withdrawl", () => {

    it("should log a DepositReturned event when deposit is successfully returned", async () => {
      const expectedEventOneResult = { 
        landlordAddress: landlord, 
        propertyId: propertyOneId, 
        returnedAmount: PropertyOneFullDeposit,
        tenantAddress: tenantAlice,
        agreementState: agreementState.ENDED
      };

      await tenancyDeposit.createDepositAgreement(propertyOneId, propertyOneDeposit, { from: landlord });
      await tenancyDeposit.payDeposit(propertyOneId, { from: tenantAlice, value: PropertyOneFullDeposit });
      await tenancyDeposit.approveDepositReturn(propertyOneId, zeroDeductions, { from: landlord })

      if(estimateGas) {
        amountOfGas = await tenancyDeposit.withdrawDeposit.estimateGas(propertyOneId, { from: tenantAlice });
        console.log("amountOfGas withdrawDeposit: ", amountOfGas);
      }

      const resultOne = await tenancyDeposit.withdrawDeposit(propertyOneId, { from: tenantAlice });
        expect(resultOne.logs[0].args.landlord).to.equal(expectedEventOneResult.landlordAddress);
        expect(resultOne.logs[0].args.propertyId.toString()).to.equal(expectedEventOneResult.propertyId);
        expect(resultOne.logs[0].args.returnedAmount.toString()).to.equal(expectedEventOneResult.returnedAmount);
        expect(resultOne.logs[0].args.tenant).to.equal(expectedEventOneResult.tenantAddress);
        expect(resultOne.logs[0].args.agreementState.toString()).to.equal(expectedEventOneResult.agreementState);
    });

    it("should error if attempt is made by non-tenant or incorrect tenant to withdraw deposit", async () => {
      await tenancyDeposit.createDepositAgreement(propertyTwoId, propertyTwoDeposit, { from: landlord });
      await tenancyDeposit.payDeposit(propertyTwoId, { from: tenantBob, value: PropertyTwoFullDeposit });
      await tenancyDeposit.approveDepositReturn(propertyTwoId, zeroDeductions, { from: landlord })

      await catchRevert(tenancyDeposit.withdrawDeposit(propertyTwoId, { from: tenantAlice }));
    });

    it("should error if attempt is made to withdraw deposit before it has been released", async () => {
      await tenancyDeposit.createDepositAgreement(propertyOneId, propertyOneDeposit, { from: landlord });
      await tenancyDeposit.payDeposit(propertyOneId, { from: tenantAlice, value: PropertyOneFullDeposit });

      await catchRevert(tenancyDeposit.withdrawDeposit(propertyOneId, { from: tenantAlice }));
    });

    it("should error if attempt is made to withdraw deposit that has already been withdrawn", async () => {
      await tenancyDeposit.createDepositAgreement(propertyOneId, propertyOneDeposit, { from: landlord });
      await tenancyDeposit.payDeposit(propertyOneId, { from: tenantAlice, value: PropertyOneFullDeposit });
      await tenancyDeposit.approveDepositReturn(propertyOneId, zeroDeductions, { from: landlord });
      await tenancyDeposit.withdrawDeposit(propertyOneId, { from: tenantAlice });
      
      await catchRevert(tenancyDeposit.withdrawDeposit(propertyOneId, { from: tenantAlice }));
    });
  });


  describe("Deposit agreement - contract balance", () => {

    it("should return balance of all deposits", async () => {
      await tenancyDeposit.createDepositAgreement(propertyOneId, propertyOneDeposit, { from: landlord });
      await tenancyDeposit.payDeposit(propertyOneId, { from: tenantAlice, value: PropertyOneFullDeposit });


      await tenancyDeposit.createDepositAgreement(propertyTwoId, propertyTwoDeposit, { from: landlord });
      await tenancyDeposit.payDeposit(propertyTwoId, { from: tenantBob, value: PropertyTwoFullDeposit });

      if(estimateGas) {
        amountOfGas = await tenancyDeposit.depositBalances.estimateGas({ from: landlord });
        console.log("amountOfGas depositBalances: ", amountOfGas);
      }

      const balance = await tenancyDeposit.depositBalances({ from: landlord });

      expect(balance.toString()).to.equal(web3.utils.toWei('1.5', 'ether'));
    });

    it("should error if non-landlord attempt to get balance of all deposits", async () => {
      await catchRevert(tenancyDeposit.depositBalances({ from: tenantAlice }));
    });
  });
});