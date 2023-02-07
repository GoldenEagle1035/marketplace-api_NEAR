const { keyStores, KeyPair, connect, Contract, utils: { format: { parseNearAmount } } } = require('near-api-js'),
    { User, Transfer } = require('../models'),
    jsonwebtoken = require('jsonwebtoken'),
    { getNearConfig } = require('../lib/near'),
    fs = require('fs'),
    { transaction } = require('objection'),
    { getNearPriceInUSD } = require('../lib/near')

async function LinkWallet(body) {
    const user = await User.query().findOne({ twitter_id: body.user.twitter_id })
    if (!user) {
        throw {
            message: 'User not found!'
        }
    }
    await User.query().patchAndFetchById(user.id, {
        near_account_id: body.account_id, connected_to_near: true, near_public_key: body.near_public_key, near_account_type: 'connected'
    })
    let token = jsonwebtoken.sign({
        twitter_id: user.twitter_id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        banner: user.banner,
        near_connected: true,
        near_account_id: body.account_id,
        near_public_key: body.near_public_key,
        id: user.id,
        type: user.type,
        near_account_type: 'connected'
    },
        process.env.JWT_SECRET_KEY,
    )
    return {
        success: true,
        token
    }
}
async function sendMoney(body, user) {
    if (!body.is_wallet && !body.receiver_id) {
        throw {
            message: 'External account should be provided!'
        }
    }
    if (!body.near_price) {
        throw {
            message: 'Amount should be provided!'
        }
    }
    let reciever
    if (!body.is_wallet) {
        reciever = await User.query().findById(body.receiver_id)
    }

    if (!body.is_wallet && !reciever) {
        throw {
            message: 'Reciever does not found'
        }
    }
    let nearConfig = await getNearConfig([user.near_account_id, process.env.NEAR_CONTRACT_ACCOUNT])
    let price = parseNearAmount(`${body.near_price}`)
    // Configure the client with nearConfig and our local key store
    const client = await connect(nearConfig);
    const account = await client.account(user.near_account_id)
    let { USD } = await getNearPriceInUSD()
    let usdPrice = parseInt(body.near_price * USD * 100)
    let send = await account.sendMoney(body.is_wallet ? body.wallet : reciever.near_account_id, price)
    const transfer = await transaction(
        Transfer,
        async (Transfer) => {
            let transfer = await Transfer.query().insert({
                transfer_to: body.receiver_id,
                transfer_by: user.id,
                type: 'send',
                transaction_hash: send.transaction.hash,
                yocto_near_price: price,
                price_in_usd: usdPrice,
            })
            transfer.price = -1 * transfer.price_in_usd
            transfer.price_in_usd = -1 * transfer.price_in_usd
            transfer.price_in_yocto_near = -1 * price
            transfer.transferBy = user
            transfer.transferTo = reciever
            return transfer
        }
    )
    return {
        success: true,
        ...transfer
    }
}
async function createNewNearAccount(u) {
    const user = await User.query().findOne({ twitter_id: u.twitter_id })
    if (!user) {
        throw {
            message: 'User not found!'
        }
    }
    if (user.connected_to_near) {
        throw {
            message: `User is already associated with ${user.near_account_id}`
        }
    }
    let accountId = String((new Date()).getTime())
    let nearConfig = await getNearConfig([accountId, process.env.OWNER_NEAR_ACCOUNT])
    let publicKey = nearConfig.publicKey
    delete nearConfig.publicKey

    // Configure the client with nearConfig and our local key store
    const client = await connect(nearConfig);
    const creatorAccount = await client.account(process.env.OWNER_NEAR_ACCOUNT);
    // Create the account
    try {
        await creatorAccount.functionCall({
            contractId: process.env.NODE_ENV === 'production' ? "near" : "testnet",
            methodName: "create_account",
            args: {
                new_account_id: accountId + (process.env.NODE_ENV === 'production' ? '.near' : ''),
                new_public_key: publicKey,
            },
            gas: "300000000000000",
            attachedDeposit: parseNearAmount(`0.01`),
        });
        await User.query().patchAndFetchById(user.id, {
            near_account_id: accountId + (process.env.NODE_ENV === 'production' ? '.near' : ''),
            connected_to_near: true,
            near_public_key: publicKey
        })
        let token = jsonwebtoken.sign({
            twitter_id: user.twitter_id,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            banner: user.banner,
            near_connected: true,
            near_account_id: accountId + (process.env.NODE_ENV === 'production' ? '.near' : ''),
            near_public_key: publicKey,
            id: user.id,
            type: user.type,
        },
            process.env.JWT_SECRET_KEY,
        )
        return {
            success: true,
            token
        }
    }
    catch (error) {
        console.log("ERROR:", error.message);
        throw {
            message: error.message
        }
    }
}

module.exports = {
    LinkWallet,
    createNewNearAccount,
    sendMoney
}
