const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) =>{
    return ethers.utils.parseUnits(n.toString(), 'ether');
}

const ether = tokens;

describe('RealEstate', () => {
    let realEstate, escrow;
    let deployer, seller;
    let nftID = 1;
    let purchasePrice = ether(100);
    let escrowAmount = ether(20);

    beforeEach(async () => {
        //Setup Accounts
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        seller = deployer
        buyer = accounts[1];
        inspector = accounts[2];
        lender = accounts[3];

        //Load COntracts
        const RealEstate = await ethers.getContractFactory('RealEstate');
        const Escrow = await ethers.getContractFactory('Escrow');

        //Deploying contracts
        realEstate = await RealEstate.deploy();
        escrow = await Escrow.deploy
            (
                realEstate.address,
                nftID,
                purchasePrice,
                escrowAmount,
                seller.address,
                buyer.address,
                inspector.address,
                lender.address
            );
        
            //seller Approves NFT
            transaction = await realEstate.connect(seller).approve(escrow.address, nftID);
            await transaction.wait();
    })

    describe('Deployment', async () => {
        it('sends an NFT to the seller/deployer', async () => {
            expect(await realEstate.ownerOf(nftID)).to.equal(seller.address);
        })
    })
    describe('Selling Real Estate', async () => {
        let balance, transaction;

        it('executes a successfull transaction', async () => {
            //Expects seller to be NFT owner before the sale
            expect(await realEstate.ownerOf(nftID)).to.equal(seller.address);

            //Check escrow balance
            balance = await escrow.getBalance();
            console.log("Escrow balance: ", ethers.utils.formatEther(balance));

            //Buyer deposits Earnest
            transaction = await escrow.connect(buyer).depositEarnest({value: escrowAmount});

            //Check escrow balance
            balance = await escrow.getBalance();
            console.log("Escrow balance: ", ethers.utils.formatEther(balance));

            //Inspector update status
            transaction = await escrow.connect(inspector).updateInspectionStatus(true);
            await transaction.wait();
            console.log("Inspector updates status");

            //Buyer Approves Sale
            transaction = await escrow.connect(buyer).approveSale();
            await transaction.wait();
            console.log("Buyer approves sale");

            //Seller Approves Sale
            transaction = await escrow.connect(seller).approveSale();
            await transaction.wait();
            console.log("Seller approves sale");

            //Lender funds to contracts
            transaction = await lender.sendTransaction({to:escrow.address, value: ether(80)});
            await transaction.wait();
            console.log("Lender funds the contract");

            //Lender Approves Sale
            transaction = await escrow.connect(lender).approveSale();
            await transaction.wait();
            console.log("Lender approves sale");

            //Finalize sale
            transaction = await escrow.connect(buyer).finalizeSale()
            await transaction.wait();
            console.log("Buyer finalizes sale");

            //Expects the buyer to be owner of NFT after sale
            expect(await realEstate.ownerOf(nftID)).to.equal(buyer.address);

            //Expect Seller to receive funds
            balance = await ethers.provider.getBalance(seller.address);
            console.log("Seller balance: ", ethers.utils.formatEther(balance));
            expect(balance).to.be.above(ether(10099));
        })
    })


})