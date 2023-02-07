let { Album, Transfer, Song } = require('../models'),
    { onBuyAlbumTokens, unlockToken, getSale, getNearPriceInUSD, onBuySongToken } = require('../lib/near'),
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters'),
    _ = require('lodash'),
    moment = require('moment')
const { utils: { format: { parseNearAmount } } } = require('near-api-js');

module.exports = {
    async getTransfers(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, Transfer, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getTransfer(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let theTransfer = await Transfer.query().findById(id).eager(query.related)

        if (!theTransfer) {
            throw {
                message: 'Transfer Not Found',
                statusCode: 404
            }
        }

        return theTransfer
    },
    async transferToken(tokenBody, user) {
        let token = await Album.query().findOne({ id: tokenBody.token_id }).eager('[currentOwner]')
        if (!token) {
            throw {
                message: 'Album not found'
            }
        }
        if (!tokenBody.copy_number && (!token.has_copy || !parseInt(token.available_qty))) {
            throw {
                message: 'This album does not have album copies any more'
            }
        }
        let copy_number = parseInt(token.qty) - parseInt(token.available_qty) + 1

        let transactionHash = await onBuyAlbumTokens(token.cover_cid, parseInt(copy_number), user.near_account_id, token.yocto_near_price)
        const transfer = await transaction(
            Album,
            Transfer,
            Song,
            async (Album, Transfer) => {
                await Album.query().patchAndFetchById(token.id, {
                    available_qty: token.available_qty - 1,
                    has_copy: Boolean(token.available_qty - 1),
                    current_owner: user.id,
                    is_purchased: true
                })
                let transfer = await Transfer.query().insert({
                    // if current album has copies, then it is transferred from the original author
                    transfer_by: Boolean(token.available_qty) ? token.user_id : token.currentOwner.id,
                    transfer_to: user.id,
                    transaction_hash: transactionHash,
                    copy_number: (token.qty - token.available_qty) + 1,
                    token: token.cover_cid,
                    type: 'album_bundle',
                    yocto_near_price: token.yocto_near_price,
                    price_in_usd: token.price
                })
                let songs = await Song.query().where({ album_id: token.id })
                let results = await Promise.all(
                    songs.map(song =>
                        Transfer.query().insert({
                            transfer_by: token.currentOwner.id,
                            transfer_to: user.id,
                            transaction_hash: transactionHash,
                            copy_number: (token.qty - token.available_qty) + 1,
                            token: song.song_cid,
                            type: 'song',
                            yocto_near_price: 0,
                            price_in_usd: 0
                        }))
                )
                return transfer
            })
        return transfer
    },
    async unlockToken(tokenBody, user) {
        if (!tokenBody.token) {
            throw {
                message: 'Token is not provided',
            }
        }
        let transactionHash = await unlockToken(tokenBody.token, user.near_account_id)

        return {
            message: 'Successfully unlocked!',
            hash: transactionHash
        }
    },
    async getSale(tokenBody, user) {
        if (!tokenBody.type) {
            throw {
                message: 'Type is not provided',
            }
        }
        if (!tokenBody.copy_number || typeof tokenBody.copy_number !== 'number') {
            throw {
                message: 'Please provide the copy number',
            }
        }
        let token, type = tokenBody.type
        if (type === 'album') {
            token = await Album.query().findOne({ cover_cid: tokenBody.token_id }).eager('[currentOwner]')
            if (!token) {
                throw {
                    message: 'Album not found'
                }
            }
            if (token.current_owner !== user.id) {
                throw {
                    message: 'Only owner can unlock this token'
                }
            }
        } else {
            token = await Song.query().findOne({ song_cid: tokenBody.token_id }).eager('[currentOwner]')
            if (!token) {
                throw {
                    message: 'Song not found'
                }
            }
            if (token.current_owner !== user.id) {
                throw {
                    message: 'Only owner can unlock this token'
                }
            }
        }
        let sale = await getSale(type === 'album' ? token.cover_cid : token.song_cid, parseInt(token.available_qty), user.near_account_id)

        return {
            ...sale
        }
    }
}
