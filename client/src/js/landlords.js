import { CONTRACT_ADDRESS } from './utils/constants.js';

let account = null;
let tenancyDepositAbi = null;
let provider = null;
let signer = null;
let contract = null;

let propertyTableData = new Map();
let propertyTableId = "#properties";
let propertyTableClass = ".properties";

$(window).on('load', function () {
    // Load contract ABI
    $.getJSON("./src/contracts/TenancyDeposit.json", function(json) {
        tenancyDepositAbi = json;
    });

    // Check metamask is available
    if(window.ethereum && window.ethereum.isMetaMask === true) {
        console.log('window.ethereum is enabled and MetaMask is active');
        provider = new ethers.providers.Web3Provider(window.ethereum);
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

    // Submission of create-deposit form
    $("#create-deposit").submit(function(event) {
        $("#load-create-deposit").addClass("spinner-border spinner-border-sm");
        console.log("create-deposit clicked");
        let inputs = $(this).serializeArray();
        this.reset();
        event.preventDefault();
        createDeposit(inputs).then((response) => {
            $("#load-create-deposit").removeClass("spinner-border spinner-border-sm");
            $('.toast').toast('show');
            if (!response || response.includes("TypeError")) { 
                $('.toast-body').html("<p>Failed to proceed.</p>Please ensure wallet is conneceted and input is valid");
            } else if (!response || response.includes("reverted")) {
                let revertError = response.match(/reverted(.*?)\"/g);
                console.log("result: ", revertError[0]);
                $('.toast-body').html(revertError[0]);
            } else {
                $('.toast-body').html("New deposit agreement successfully created");
            }
        });
    });

    // Submission of return-deposit (approve return) form
    $("#return-deposit").submit(function(event) {
        $("#load-return-deposit").addClass("spinner-border spinner-border-sm");
        console.log("return-deposit clicked");
        let inputs = $(this).serializeArray();
        event.preventDefault();
        this.reset();
        returnDeposit(inputs).then((response) => {
            $("#load-return-deposit").removeClass("spinner-border spinner-border-sm");
            $('.toast').toast('show');
            if (!response || response.includes("TypeError")) { 
                $('.toast-body').html("<p>Failed to proceed.</p>Please ensure wallet is connected and input is valid");
            } else if (!response || response.includes("reverted")) {
                let revertError = response.match(/reverted(.*?)\"/g);
                console.log("result: ", revertError[0]);
                $('.toast-body').html(revertError[0]);
            } else {
                $('.toast-body').html("Deposit successfully approved for withdrawl: " + response.tenant.toString().slice(0,9));
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
                updatePropertyTableData();
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

async function createDeposit(inputs) {
    try {
        let propertyId = inputs[0].value;
        let depositAmount = inputs[1].value;

        let createTx = await contract.createDepositAgreement(propertyId, ethers.utils.parseEther(depositAmount));
        await createTx.wait();
        createTx = await contract.getDeposit(propertyId);

        updatePropertyTableData();

        return createTx;
    } catch (error) {
        return error.toString();
    }
}

async function returnDeposit(inputs) {
    try {
        let propertyId = inputs[0].value;
        let deductions = inputs[1].value;

        let returnTx = await contract.approveDepositReturn(propertyId, ethers.utils.parseEther(deductions));
        await returnTx.wait();
        returnTx = await contract.getDeposit(propertyId);

        updatePropertyTableData();
        return returnTx;
    } catch (error) {
        return error.toString();
    }
}

async function updatePropertyTableData() {
    try {
        let propertyIds = [];
        propertyIds = await contract.getPropertyIds();
        for (let id of propertyIds) {
            let deposit = await contract.getDeposit(id.toString());
            propertyTableData.set(id.toString(), deposit);
            console.log(propertyTableData.get(id.toString()));
        }

        $(propertyTableId).html("");

        for (let [propertyId, deposit] of propertyTableData.entries()) {
            $(propertyTableClass).append("<tr><td>" + propertyId.toString() + "</td><td>" + deposit.tenant.toString().slice(0,9) + "</td><td>" 
            + ethers.utils.formatEther(deposit.depositAmount) + "</td><td>" + ethers.utils.formatEther(deposit.deductions) + "</td><td>" + 
            ethers.utils.formatEther(deposit.returnAmount) + "</td><td>" + getAgreementState(deposit.agreementState) + "</td></tr>");
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