let { Album, Transfer } = require('../models'),
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters'),
    { putNFTForSelling, buyNFTToken, getNearPriceInUSD } = require('../lib/near'),
    axios = require('axios'),
    moment = require('moment')

const { utils: { format: { parseNearAmount } } } = require('near-api-js');
module.exports = {
    async getAlbums(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, Album, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getAlbum(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        let theAlbum = await Album.query().findById(id).eager(query.related)

        if (!theAlbum) {
            throw {
                message: 'Album Not Found',
                statusCode: 404
            }
        }
        let res = await axios.get(`https://amplify-dev.mypinata.cloud/ipfs/${theAlbum.cid}`).catch(err => {
            throw {
                message: err.response.data
            }
        })
        theAlbum.metadata = res.data
        return theAlbum
    },
    async sellAlbumCover(tokenBody, user) {
        if (!tokenBody.id) {
            throw {
                message: 'Id is not provided',
            }
        }
        if (!tokenBody.copy_number) {
            throw {
                message: '#copy is not provided',
            }
        }
        if (!tokenBody.price) {
            throw {
                message: 'price is not provided',
            }
        }
        let token = await Transfer.query().findById(parseInt(tokenBody.id)).eager('[transferTo]')
        if (!token) {
            throw {
                message: 'Album does not exists'
            }
        }
        if (token.transfer_to !== user.id) {
            throw {
                message: 'Only owner call sell this item'
            }
        }
        const transfer = await transaction(
            Album,
            Transfer,
            async (Album, Transfer) => {
                let tokenid = `${token.token}:${tokenBody.copy_number}`
                let { USD } = await getNearPriceInUSD()
                let nearPrice = parseInt(albumBody.price / 100) / USD
                let txnHash = await putNFTForSelling(token.transferTo.near_account_id, tokenid, nearPrice)
                let transaction = await Transfer.query().patchAndFetchById(token.id, {
                    bidding_price: parseInt(tokenBody.price),
                    is_for_sale: true
                })
                return {
                    ...transaction
                }
            })
        return transfer
    },
    async buyAlbumCover(tokenBody, user) {
        if (!tokenBody.id) {
            throw {
                message: 'Id is not provided',
            }
        }
        const transfer = await transaction(
            Album,
            Transfer,
            async (Album, Transfer) => {
                let token = await Transfer.query().findById(parseInt(tokenBody.id))
                if (!token) {
                    throw {
                        message: 'Album does not exists'
                    }
                }
                let tokenid = `${token.token}:${token.copy_number}`
                let { USD } = await getNearPriceInUSD()
                let nearPrice = parseInt(albumBody.price / 100) / USD
                let txnHash = await buyNFTToken(user.near_account_id, parseNearAmount(String(nearPrice)), tokenid)
                await Transfer.query().patchAndFetchById(token.id, { is_owner: false, is_for_sale: false })
                let transfer = await Transfer.query().insert({
                    transfer_by: token.transfer_to,
                    transfer_to: user.id,
                    token: token.token,
                    copy_number: token.copy_number,
                    type: 'album',
                    transaction_hash: txnHash,
                    yocto_near_price: parseNearAmount(String(nearPrice)),
                    price_in_usd: albumBody.price
                })
                return {
                    ...transfer
                }
            }
        )
        return transfer

    },
    async createAlbum(albumBody,) {
        const album = await transaction(
            Album,
            async (Album) => {
                var newAlbum = await Album.query().insert({
                    ...albumBody
                })

                return newAlbum
            }
        )

        return album

    },

    async editAlbum(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedAlbum = await Album.query().patchAndFetchById(id, { ...newBody })

        if (!editedAlbum) {
            throw {
                message: 'Album Not Found',
                statusCode: 404
            }
        }

        return editedAlbum
    },

    async deleteAlbum(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await Album.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(Album.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'Album Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
