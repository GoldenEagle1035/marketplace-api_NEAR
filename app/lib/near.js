
const { keyStores, KeyPair, connect, Contract, transactions, utils: { format: { parseNearAmount } }, } = require('near-api-js'),
    { User, Album } = require('../models'),
    jsonwebtoken = require('jsonwebtoken')
const path = require("path");
// Load NEAR Javascript API components
const near = require("near-api-js");
const _ = require('lodash');
const axios = require('axios')
const bs58 = require('bs58')

const getNearConfig = async (accountIds) => {
    let keyStore, publicKey
    const keyPair = KeyPair.fromString(process.env.PRIVATE_KEY);

    // Setup default client options
    keyStore = new keyStores.InMemoryKeyStore();
    // adds the keyPair you created to keyStore
    await Promise.all(accountIds.map(accountId => keyStore.setKey(process.env.NEAR_NETWORK, accountId, keyPair)))
    publicKey = keyPair.getPublicKey()

    const options = {
        networkId: process.env.NEAR_NETWORK,
        nodeUrl: process.env.NEAR_NODE_URL,
        walletUrl: `https://wallet.${process.env.NEAR_NETWORK}.near.org`,
        helperUrl: `https://helper.${process.env.NEAR_NETWORK}.near.org`,
        explorerUrl: `https://explorer.${process.env.NEAR_NETWORK}.near.org`,
        accountId: process.env.OWNER_NEAR_ACCOUNT,
        keyStore: keyStore,
        publicKey: publicKey.toString()
    }
    return options
}


module.exports = {
    getNearConfig,
    getSale: async function (tokenId, copy) {
        try {
            let nearConfig = await module.exports.getNearConfig([process.env.NEAR_CONTRACT_ACCOUNT])
            // Configure the client with nearConfig and our local key store
            const client = await connect(nearConfig);
            const account = await client.account(process.env.NEAR_CONTRACT_ACCOUNT)
            const DELIMETER = '||';
            const sale = await account.viewFunction(process.env.NEAR_MARKET_ACCOUNT,
                'get_sale',
                { nft_contract_token: process.env.NEAR_CONTRACT_ACCOUNT + DELIMETER + tokenId + `:${copy}` }
            );
            return sale
        } catch (e) {
            console.log(e)
            throw {
                message: e.message
            }
        }
    },
    onBuyAlbumTokens: async function (tokenId, copy, buyerId, price) {
        try {
            let result = await module.exports.buyAlbumNftAsBundle(tokenId, buyerId, copy, price);
            return result.transaction.hash
        } catch (e) {
            console.log(e)
            throw {
                message: e.message
            }
        }
    },
    unlockToken: async function (tokenId, ownerId) {
        try {
            let nearConfig = await module.exports.getNearConfig([process.env.NEAR_CONTRACT_ACCOUNT, ownerId])
            // Configure the client with nearConfig and our local key store
            const client = await connect(nearConfig);
            const ownerAccount = await client.account(ownerId);
            let result = await module.exports.unlock_album_copy_token_type(ownerAccount, tokenId)
            return result.transaction.hash
        } catch (e) {
            console.log(e)
            throw {
                message: e.message
            }
        }
    },
    async getNearPriceInUSD() {
        try {
            const price = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=NEAR&tsyms=NEAR,USD`)
            return price.data
        } catch (e) {
            console.error(e)
            throw {
                message: 'Erro while fetching USD to NEAR'
            }
        }
    },
    async getTokenOwner(account, token) {
        let nearConfig = await module.exports.getNearConfig([process.env.NEAR_CONTRACT_ACCOUNT, account])
        // Configure the client with nearConfig and our local key store
        const client = await connect(nearConfig);
        const Account = await client.account(account);
        const result = await Account.functionCall(
            process.env.NEAR_CONTRACT_ACCOUNT,
            "nft_token",
            { token_id: token }

        )
        const jsjd = Buffer.from(result.status.SuccessValue, 'base64').toString('utf-8');
        const obj = JSON.parse(jsjd);
        return obj
    },
    async processMinting(albumHash, songsHashes, qty, price, owner_account) {
        try {
            let nearConfig = await module.exports.getNearConfig([owner_account])
            // Configure the client with nearConfig and our local key store
            const client = await connect(nearConfig);
            const OwnerAccount = await client.account(owner_account)
            let result = await OwnerAccount.functionCall(
                process.env.NEAR_CONTRACT_ACCOUNT,
                'add_token_types',
                {
                    album_hash: albumHash,
                    cover_songslist: songsHashes,
                    number_of_album_copies: qty,
                    price,
                },
                200000000000000,
                parseNearAmount('0.1'),
            )
            return result.transaction.hash
        } catch (error) {
            console.log(error)
            if (error.type === 'Expired') {
                await module.exports.processMinting(albumHash, songsHashes, qty, price, owner_account)
                return
            }
            throw {
                message: error.message,
            }
        }
    },
    async buyAlbumNftAsBundle(albumHash, buyer, copy_no, price) {
        console.log(`${albumHash}:${copy_no}`)
        let nearConfig = await module.exports.getNearConfig([buyer])
        // Configure the client with nearConfig and our local key store
        const client = await connect(nearConfig);
        const buyerAccount = await client.account(buyer)
        try {
            let result = await buyerAccount.functionCall(
                process.env.NEAR_MARKET_ACCOUNT,
                "offer_album",
                {
                    nft_contract_id: process.env.NEAR_CONTRACT_ACCOUNT,
                    albumipfs_hash_copy: `${albumHash}:${copy_no}`,
                },
                300000000000000,
                price,
            )
            return result
        } catch (error) {
            console.log({ error })
            if (error.type === 'Expired') {
                await module.exports.buyAlbumNftAsBundle(albumHash, buyer, copy_no, price)
                return
            }
            throw {
                message: error.message,
            }
        }
    },
    async putNFTForSelling(account_which_bought_the_album, songtokenid, nearPrice) {
        try {
            let nearConfig = await module.exports.getNearConfig([account_which_bought_the_album])
            // Configure the client with nearConfig and our local key store
            const client = await connect(nearConfig);
            const sellerAccount = await client.account(account_which_bought_the_album)
            const price = parseNearAmount(`${nearPrice}`);
            result = await sellerAccount.functionCall(
                process.env.NEAR_CONTRACT_ACCOUNT,
                'nft_approve',
                {
                    token_id: songtokenid,
                    account_id: process.env.NEAR_MARKET_ACCOUNT,
                    price,
                },
                300000000000000,
                parseNearAmount('0.01')
            );
            return result.transaction.hash
        } catch (error) {
            console.log({ error })
            throw {
                message: error.message,
            }
        }
    },
    async buyNFTToken(anotheraccount, price, songtokenid) {
        let nearConfig = await module.exports.getNearConfig([anotheraccount])
        // Configure the client with nearConfig and our local key store
        const client = await connect(nearConfig);
        const buyerAccount = await client.account(anotheraccount)
        try {
            result = await buyerAccount.functionCall(
                process.env.NEAR_MARKET_ACCOUNT,
                "offer",
                {
                    nft_contract_id: process.env.NEAR_CONTRACT_ACCOUNT,
                    receiver_id: buyerAccount.accountId,
                    song_token_id: songtokenid
                },
                300000000000000,
                price
            )
            return result.transaction.hash;
        } catch (error) {
            console.log(error.type)
            if (error.type == 'Expired') {
                console.log('HERE')
                await module.exports.buyNFTToken(anotheraccount, price, songtokenid)
                return
            }
            throw {
                message: error.message,
            }
        }
    }
}
