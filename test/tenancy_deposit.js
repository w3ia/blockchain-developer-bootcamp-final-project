const  SimpleTenancyDeposit = artifacts.require("TenancyDeposit");
const { Console } = require("console");
const { catchRevert } = require("./exceptionsHelpers.js");

contract("SimpleTenancyDeposit", function (accounts) {
  const [owner, landlord, tenant] = accounts;

  const depositRequired = web3.utils.toWei('2', 'ether');
  const fullDeposit = web3.utils.toWei('3', 'ether');
  const partDeposit = web3.utils.toWei('1', 'ether');

  let instance;

  beforeEach(async () => {
    instance = await SimpleTenancyDeposit.new();
    await instance.setLandlordAddress(landlord, { from: owner });
    await instance.setTenantAddress(tenant, { from: landlord });
    await instance.setDepositRequired(depositRequired, { from: landlord });
  });


  it("has correct owner", async () => {
    assert.equal(await instance.owner.call(), owner, "owner is not correct");
  });


  it("has correct landlord", async () => {
    assert.equal(await instance.landlord.call(), landlord, "landlord is not correct");
  });


  it("has correct tenant", async () => {
    assert.equal(await instance.tenant.call(), tenant, "tenant is not correct");
  });


  it("should error when non-landlord tries to add tenant", async () => {
    await catchRevert(instance.setTenantAddress(tenant, { from: owner }));
  });


  it("has correct deposit required", async () => {
    const result = await instance.setDepositRequired(depositRequired, { from: landlord });
    const depositSet = result.logs[0].args.depositRequired.toString();

    assert.equal(depositSet, depositRequired, "deposit required amount is not correct");
  });


  it("should error when non-landlord tries to set deposit required", async () => {
    await catchRevert(instance.setDepositRequired(depositRequired, { from: owner }));
  });


  it("should log a deposit event when a deposit is made", async () => {
    const result = await instance.payDeposit({ from: tenant, value: fullDeposit });

    const expectedEventResult = { tenantAddress: tenant, amount: depositRequired };

    const logTenantAddress = result.logs[0].args.tenant;
    const logDepositAmount = result.logs[0].args.depositAmount.toString();

    assert.equal(
      expectedEventResult.tenantAddress,
      logTenantAddress,
      "LogDepositMade event tenant address property not emitted, check deposit method"
    );

    assert.equal(
      expectedEventResult.amount,
      logDepositAmount,
      "LogDepositMade event amount property not emitted, check deposit method"
    );
  });


  it("should refund correct amount when deposit is overpaid", async () => {
    let tenantBalanceBefore = await web3.eth.getBalance(tenant);
    tenantBalanceBefore = web3.utils.fromWei(tenantBalanceBefore, 'ether');

    const result = await instance.payDeposit({ from: tenant, value: fullDeposit });

    let tenantBalanceAfter = await web3.eth.getBalance(tenant);
    tenantBalanceAfter = web3.utils.fromWei(tenantBalanceAfter, 'ether');
    
    // work out gas
    const resultTx = await web3.eth.getTransaction(result.tx);
    const gasUsed = result.receipt.gasUsed;
    console.log("Gas used: ", gasUsed);
    console.log("Gas price (wei): ", resultTx.gasPrice);
    let gasCost = resultTx.gasPrice * gasUsed;
    gasCost =  web3.utils.fromWei(gasCost.toString(), 'ether');
    console.log("Gas cost (eth): ", gasCost);

    // work out actual cost (gas cost + deposit)
    const ActualCost = Number(gasCost) + Number(web3.utils.fromWei(depositRequired.toString(), 'ether'));

    const expectedCost = Number(tenantBalanceBefore).toFixed(4) - Number(tenantBalanceAfter).toFixed(4);

    assert.equal(Number(expectedCost).toFixed(4), Number(ActualCost).toFixed(4), "tenant's balance should be reduced by the deposit amount");
  });


  it("should error if deposit paid is less than required", async () => {
    await catchRevert(instance.payDeposit({ from: tenant, value: partDeposit }));
  });


  it("should error if deposit is paid by non-tenant", async () => {
    await catchRevert(instance.payDeposit({ from: landlord, value: fullDeposit }));
  });


  it("should error if tenant tries to pay deposit more than once", async () => {
    await instance.payDeposit({ from: tenant, value: fullDeposit });
    await catchRevert(instance.payDeposit({ from: tenant, value: fullDeposit }));
  });


  it("should log a deposit returned event when a deposit is returned", async () => {
    await instance.payDeposit({ from: tenant, value: fullDeposit });
    const result = await instance.returnDeposit({ from: landlord });
    const expectedEventResult = { landlordAddress: landlord, tenantAddress: tenant, amount: depositRequired };

    const logLandlordAddress = result.logs[0].args.landlord;
    const logTenantAddress = result.logs[0].args.tenant;
    const logReturnedAmount = result.logs[0].args.returnedAmount.toString();

    assert.equal(
      expectedEventResult.landlordAddress,
      logLandlordAddress,
      "LogDepositMade event landlord address property not emitted, check deposit method"
    );

    assert.equal(
      expectedEventResult.tenantAddress,
      logTenantAddress,
      "LogDepositMade event tenant address property not emitted, check deposit method"
    );

    assert.equal(
      expectedEventResult.amount,
      logReturnedAmount,
      "LogDepositMade event deposit returned property not emitted, check deposit method"
    );
  });
});