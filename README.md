# Simple Tenancy Deposits
## Project Description
### Background
In the UK, landlords must secure/protect any deposit taken from a tenant in a government-approved tenancy deposit scheme (TDP). TDPs are currently provided by approved third-party companies who can either hold the deposit on behalf of the tenant and landlord (custodial service) or provide insurance for the deposit if it  is held by the landlord or agent (insurance-backed service). Furthermore, the TDP company is also responsible for handling any disputes that may arise between tenant and landlord during the returning of the deposit at the end of a tenancy agreement.

For further details on the TDP see https://www.gov.uk/tenancy-deposit-protection.

### Proposed Solution
This project aims to implement a streamlined tenancy deposit service based on Ethereum smart contracts - "Simple Tenancy Deposits".

The solution will implement a single web application/dapp for both tenants and landlords to manage deposits and deposit agreements.

### High Level User Workflow

#### Landlord
1. Login to application.
2. View agreementdetails about all their properties.
3. Add new deposit agreements.
4. For any newly tenanted properties (including renewals), view the received deposit amount.
5. For any 'end of tenancy' properties, make deductions and deposit releases.

#### Tenant
1. Login to application.
2. View details about their rented property.
3. Pay required deposit amounts or view existing deposit details.
4. Withdraw released deposits.

### Design details/considerations
* Current deployed contract is 1 Landlord-to-Many Tenants. IRL the contract would support multiple landlords.
* Deposits are stated in ether.
* A tenant is allowed to pay a deposit on more than one property e.g. Commercial tenants.
* A landlord can (re)create an agreement for an existing property, as long as the existing agreement is either in a created(unpaid) or ended state.
* A tenant cannot pay a deposit on a property that does not exist.
* A tenant cannot withdraw a deposit that has not been released.
* A landlord cannot pay a deposit on a property they own i.e. Landlord cannot become a tenant of their own property.
* Contract does not implement withdrawls for landlords - the implementation would be the same as the implemented withdrawl for tenants.

## Deployed App
**Public URL:** **https://condescending-mirzakhani-b803b5.netlify.app**

**Contract is deployed to the Rinkeby testnet**

**Please Note:** You will **only** be able to interact with the app as a "Tenant", as "Landlord" access is limited to the contract owner. 

As a Tenant you will be able to:
* Connect your wallet via the Tenants page (/tenants.html).
* Refresh the available properties list.
* Refresh deposits list.
* Make a payment (pay deposit) for an available property.
* See the property move to the deposits list and its status change to "Active", once the payment completes.

For **full** interaction, please see the [**Local Setup**](https://github.com/w3ia/blockchain-developer-bootcamp-final-project#local-setup) section below for details on deploying and accessing the application locally. Also see the [**Video Walkthrough**](https://github.com/w3ia/blockchain-developer-bootcamp-final-project#video-walkthrough) section below for a full demo of the app.

## Video Walkthrough
* [Youtube](https://youtu.be/6zsJu5JkvaE)
* [Download](https://github.com/w3ia/blockchain-developer-bootcamp-final-project/raw/main/project_walkthrough.mp4)


## Project Structure
```
.
????????? client
???   ????????? src
???   ???   ????????? contracts
???   ???   ???   ????????? Migrations.json
???   ???   ???   ????????? TenancyDeposit.json
???   ???   ????????? js
???   ???       ????????? utils
???   ???       ???   ????????? constants.js
???   ???       ????????? landlords.js
???   ???       ????????? tenants.js
???   ????????? index.html
???   ????????? landlords.html
???   ????????? tenants.html
????????? contracts
???   ????????? Migrations.sol
???   ????????? TenancyDeposit.sol
????????? migrations
???   ????????? 1_initial_migration.js
???   ????????? 2_deploy_contracts.js
????????? test
???   ????????? exceptionsHelpers.js
???   ????????? tenancy_deposit.js
????????? LICENSE
????????? README.md
????????? avoiding_common_attacks.md
????????? deployed_address.txt
????????? design_pattern_decisions.md
????????? finalprojectchecklist.txt
????????? package-lock.json
????????? package.json
????????? truffle-config.js
```
## Local Setup
Project was built and tested against:
* Node v16.5.0
* Npm v7.19.1

And has the following npm dependecies:
* ganache-cli v6.12.2
* truffle v5.4.22
* @truffle/hdwallet-provider v1.7.0
* @openzeppelin/contracts v4.3.3
* web3 1.5.3
* bignumber.js v7.2.1
* dotenv v10.0.0
* http-server v14.0.0

To run locally, please follow these instructions:
1. Ensure **truffle** and **ganache-cli** are installed. If not run: ``npm i -g ganache-cli`` and ``npm i -g truffle``. Also ensure you have **Metamask** installed in your browser (https://metamask.io/download).
2. Open a new terminal window and start the Ganache CLI on the default port (8545): ```ganache-cli```.
3. Take the private keys of the first two accounts (account [0] and account [1]) generated by Ganache and import them into your Metamask browser extension (these will be needed for front-end/UI testing).
4. Clone/checkout this repository e.g.
``git clone https://github.com/w3ia/blockchain-developer-bootcamp-final-project.git``
5. Cd to the cloned repo directory and run ``npm install``.
6. Once install is complete:
 * To compile the contract(s) run: ``truffle compile``.
 * To test the contract(s) run: ``truffle test``.
 * To migrate the contracts run: ``truffle migrate``.
7. Once the contract(s) have been migrated, to test/access the front-end:
* From the ``truffle migrate`` output, get the **contract address** of the **TenancyDeposit** deployment and update the **CONTRACT_ADDRESS** constant in the ``client/src/js/utils/constants.js`` file with this contract address.
* From the project root, run ``npm start``. This will open a browser window to http://localhost:3000.
* To interact with the app, ensure Metamask is connected to the **Localhost 8545** network, and use **account [0]** imported in step 4 above for Landlord and **account[1]** imported in step 4 above for Tenant (For full demo usage, please see the [**Video Walkthrough**](https://github.com/w3ia/blockchain-developer-bootcamp-final-project#video-walkthrough) section above.)

## Completion NFT
https://etherscan.io/nft/0x1975fbcf98b5678db232c8d2c78fb574fab14d73/156
