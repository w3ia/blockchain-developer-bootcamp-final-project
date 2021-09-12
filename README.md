# Smart Tenancy Deposits
## Project Description
### Background
In the UK, landlords must secure/protect any deposit taken from a tenant in a government-approved tenancy deposit scheme (TDP). TDPs are currently provided by approved third-party companies who can either hold the deposit on behalf on the tenant and landlord (custodial service) or provide insurance for the deposit if it  is held by the landlord or agent (insurance-backed service). Furthermore, the TDP company is also responsible for handling any disputes that may arise between tenant and landlord during the returning of the deposit at the end of a tenancy agreement.

For furthe details on the TDP see [0]

### Current Challenges

The biggest challenges for both tenants and landlords/letting agents with current TDPs is one of trust, communication, time, as well as understanding legal requirements.

#### For Landords
* Landlords must understand how to correctly protect a deposit and be aware of their legal responsibilty.
  * Some landlords, in particular non-professional ones, will often delegate the deposit process to a letting agent for a fee and will have to trust the letting agent to correctly protect a deposit with a TDP.

* Once a deposit is protected, the landlord or agent has 30 days to provide the tenant a list of information regarding the details of the protection including how much of the deposit has been protected, where it is protected, how the tenant can get the deposit back and how they can raise any disputes (For the full list of details see [1]). Failing to provide this information within the stated time can result in legal action against the **landlord**.


#### For tenants
* Tenants must rely/trust the landlord or agent to protect their deposit correctly. It is also the tenants responsibilty to check if the deposit has been protected correctly and raise a legal claim it if has not. 

## Proposed Solution
This project aims to implement a streamlined tenancy deposit service based on Ethereum smart contracts - "Smart Tenancy Deposits".

The solution will implement a single web application for both tenants and lanlords to manage deposits and deposit agreements i.e. Via the use of smart contracts, the deposit will be protected by both the tenant and landlord wallets and any amount will not be withdrawable without approval from both parties. There will also be an adjudication service to handle and resolve any disputes between landlord and tenant (in reality and in compliance with UK law, this would be the government approved/authorised third party which is providing this "smart tenancy deposit" service).

### (Very) Highlevel User Workflow
#### Tenants
1. Login to application.
2. View details about their rented property e.g. Address, tenancy agreement start and end dates, etc.
3. Pay required deposit amounts or view existing deposit details.
4. Request for deposit to be released or renewed, depending on whether tenancy agreement is being ended or renewed.
5. Raise disputes or view existing/ongoing dispute.

#### Landlord
1. Login to application.
2. View details about all their properties.
3. For any newly tenanted properties (including renewals), view the received deposit amount.
4. Issue deposit details/certificate to the tenant via a non-fungiable asset.
5. For any 'end of tenancy' properties, view deposit releases and agree/disagree.
6. Raise disputes or view existing/ongoing disputes.

#### Adjudicator 
1. Login to application
2. View disputes.
3. Resolve disputes.


### Technical Workflow/Design

TBD

-----
[0] - https://www.gov.uk/tenancy-deposit-protection

[1] - https://www.gov.uk/tenancy-deposit-protection/information-landlords-must-give-tenants

