import { CONTRACT_ADDRESS } from './utils/constants.js';

let account = null;
let tenancyDepositAbi = null;
let provider = null;
let signer = null;
let contract = null;

$(window).on('load', function () {

    // Load contract ABI
    $.getJSON("./src/contracts/TenancyDeposit.json", function(json) {
        tenancyDepositAbi = json;
    });

    // Check metamask is available
    if(window.ethereum && window.ethereum.isMetaMask === true) {
        console.log('window.ethereum is enabled and MetaMask is active');
        if(!provider) {
            provider = new ethers.providers.Web3Provider(window.ethereum);
        }
    } else {
        console.log("falling back to Ganache")
        const url = "http://127.0.0.1:8545";
        provider = new ethers.providers.JsonRpcProvider(url);
    }

    // Connect wallet event
    $("#connect-wallet").click(function() {
        console.log("connect-wallet clicked");
        connectWallet().then((response) => {
            $('.toast').toast('show');
            $('.toast-body').html(response);
        });
    });

    // Refresh property table event
    $("#refresh-properties").click(function() {
        console.log("refresh-properties clicked");
        $("#load-refresh-properties").addClass("spinner-border spinner-border-sm");
        updatePropertyTableData().then((response) => {
            $("#load-refresh-properties").removeClass("spinner-border spinner-border-sm");
            $('.toast').toast('show');
            if (!response.length || response.includes("TypeError")) {
                $('.toast-body').html("<p>Failed to refresh.</p>Please ensure wallet is connected.");
            } else if (!response.length || response.includes("reverted")) {
                let revertError = response.match(/reverted(.*?)\"/g);
                console.log("result: ", revertError[0]);
                $('.toast-body').html(revertError[0]);
            } else {
                $('.toast-body').html("Property table successfully refreshed");
            }
        });
    });

    $("#refresh-deposits").click(function() {
        console.log("refresh-deposits clicked");
        $("#load-refresh-deposits").addClass("spinner-border spinner-border-sm");
        updateDepositTableData().then((response) => {
            $("#load-refresh-deposits").removeClass("spinner-border spinner-border-sm");
            $('.toast').toast('show');
            if (!response.length || response.includes("TypeError")) {
                $('.toast-body').html("<p>Failed to refresh.</p>Please ensure wallet is connected.");
            } else if (!response.length || response.includes("reverted")) {
                let revertError = response.match(/reverted(.*?)\"/g);
                console.log("result: ", revertError[0]);
                $('.toast-body').html(revertError[0]);
            } else {
                $('.toast-body').html("Deposit table successfully refreshed");
            }
        });
    });

    $("#pay-deposit").submit(function(event) {
        $("#load-pay-deposit").addClass("spinner-border spinner-border-sm");
        console.log("pay-deposit clicked");
        let inputs = $(this).serializeArray();
        this.reset();
        event.preventDefault();
        payDeposit(inputs).then((response) => {
            $("#load-pay-deposit").removeClass("spinner-border spinner-border-sm");
            $('.toast').toast('show');
            if (!response || response.includes("TypeError")) { 
                $('.toast-body').html("<p>Failed to proceed.</p>Please ensure wallet is conneceted and input is valid");
            } else if (!response || response.includes("reverted")) {
                let revertError = response.match(/reverted(.*?)\"/g);
                console.log("result: ", revertError[0]);
                $('.toast-body').html(revertError[0]);
            } else {
                $('.toast-body').html("Deposit successfully paid");
            }
        });
    });

    $("#withdraw-deposit").submit(function(event) {
        $("#load-withdraw-deposit").addClass("spinner-border spinner-border-sm");
        console.log("withdraw-deposit clicked");
        let inputs = $(this).serializeArray();
        this.reset();
        event.preventDefault();
        withdrawDeposit(inputs).then((response) => {
            $("#load-withdraw-deposit").removeClass("spinner-border spinner-border-sm");
            $('.toast').toast('show');
            if (!response || response.includes("TypeError")) { 
                $('.toast-body').html("<p>Failed to proceed.</p>Please ensure wallet is conneceted and input is valid");
            } else if (!response || response.includes("reverted")) {
                let revertError = response.match(/reverted(.*?)\"/g);
                console.log("result: ", revertError[0]);
                $('.toast-body').html(revertError[0]);
            } else {
                $('.toast-body').html("Deposit successfully withdrawn");
            }
        });
    });
});

async function connectWallet() {
    if(window.ethereum && window.ethereum.isMetaMask === true) {
        console.log('window.ethereum is enabled and MetaMask is active');
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            if (accounts.length !== 0) {
                account = accounts[0];
                console.log('Found an authorised account:', account);
                signer = provider.getSigner(account);
                contract = new ethers.Contract(CONTRACT_ADDRESS, tenancyDepositAbi.abi, signer);
                return ("Connected via Account: " + account.slice(0,9));
            }
        } catch (error) {
            // User denied account access...
            console.error(error);
            return ("Error: User denied account access");
        }
    } else {
        const url = "http://127.0.0.1:8545";
        provider = new ethers.providers.JsonRpcProvider(url);
        return ("Connected via Ganache (port 8545)");
    }
}

async function payDeposit(inputs) {
    try {
        let propertyId = inputs[0].value;
        let deposit = await contract.getDeposit(propertyId);
        let payTx = await contract.payDeposit(propertyId, { value: deposit.depositAmount});
        await payTx.wait();

        updateDepositTableData();
        updatePropertyTableData();

        return true;

    } catch (error) {
        console.error(error);
        return error.toString();
    }
}

async function withdrawDeposit(inputs) {
    try {
        let propertyId = inputs[0].value;
        let withdrawTx = await contract.withdrawDeposit(propertyId);
        await withdrawTx.wait();

        updateDepositTableData();
        updatePropertyTableData();

        return true;

    } catch (error) {
        console.error(error);
        return error.toString();
    }
}

async function updatePropertyTableData() {
    try {
        let propertyTableData = new Map();
        let propertyTableId = "#properties";
        let propertyTableClass = ".properties";
        let propertyIds = [];

        $(propertyTableId).html("");

        propertyIds = await contract.getPropertyIds();
        for (let id of propertyIds) {
            console.log("here");
            let deposit = await contract.getDeposit(id.toString());
            if(deposit.agreementState == 1) {
                propertyTableData.set(id.toString(), deposit);
                console.log(propertyTableData.get(id.toString()));
            }
        }

        for (let [propertyId, deposit] of propertyTableData.entries()) {
            $(propertyTableClass).append("<tr><td>" + propertyId.toString() + "</td><td>" + deposit.landlord.toString().slice(0,9) + "</td><td>" + ethers.utils.formatEther(deposit.depositAmount) + "</td><td>" + getAgreementState(deposit.agreementState) + "</td></tr>");
        }
        return propertyIds;
    } catch (error) {
        console.error(error);
        return error.toString();
    }
}

async function updateDepositTableData() {
    try {
        let depositTableData = new Map();
        let depositTableId = "#deposits";
        let depositTableClass = ".deposits";
        let propertyIds = [];

        $(depositTableId).html("");

        propertyIds = await contract.getPropertyIds();
        for (let id of propertyIds) {
            let deposit = await contract.getDeposit(id.toString());
            console.log(deposit);
            if(deposit.tenant.toLowerCase()  == account.toLowerCase()) {
                console.log("account: ", account);
                console.log("tenant: ", deposit.tenant.toString());
                depositTableData.set(id.toString(), deposit);
                console.log(depositTableData.get(id.toString()));
            }  
        }

        for (let [propertyId, deposit] of depositTableData.entries()) {
            $(depositTableClass).append("<tr><td>" + propertyId.toString() + "</td><td>" + deposit.landlord.toString().slice(0,9) + "</td><td>" + ethers.utils.formatEther(deposit.depositAmount) + "</td><td>" + ethers.utils.formatEther(deposit.deductions) + "</td><td>" + ethers.utils.formatEther(deposit.returnAmount) + "</td><td>" + getAgreementState(deposit.agreementState) + "</td></tr>");
        }
        return propertyIds;
    } catch (error) {
        console.error(error);
        return error.toString();
    }
}

function getAgreementState(state) {
    switch (state) {
        case 0:
            return "Empty";
        case 1:
            return "Created - Pending deposit payment";
        case 2:
            return "Active - Deposit paid";
        case 3:
            return "Released - Withdrawl approved";
        case 4:
            return "Ended - Deposit withdrawn";
    }
}

function refresh () {
   /* updateDepositTableData(propertyId)
    if(propertyId && deposit) {
        if(deposit.agreementState == 1) {
            $("#pay").removeClass("disabled");
        }
        if(deposit.agreementState == 3) {
            $("#withdraw").removeClass("disabled");
        }
    }
    setTimeout(refresh, 2500);*/
}
