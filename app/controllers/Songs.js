let { Song, Transfer, Playlist, Album } = require('../models'),
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters'),
    { putNFTForSelling, buyNFTToken, getNearPriceInUSD } = require('../lib/near'),
    moment = require('moment'),
    _ = require('lodash')
const { utils: { format: { parseNearAmount } } } = require('near-api-js');

module.exports = {
    async getSongs(query = {}, pageNumber = 0, perPage = 20, user) {
        let albums = await Album.query().where({ is_deleted: false, user_id: user.id, has_copy: true }).eager('[songs.album]')
        let preparedFetch = Song.query().alias('model')
        // if (query && query.filter && query.filter.user_playlist) {
        let playlist = Playlist.query().alias('play')
        let playlists = await playlist.where({ is_deleted: false, user_id: user.id }).eager('[songs]')
        let songIds = playlists.reduce((acc, cur) => [...acc, ...cur.songs.map(s => s.id)], [])
        preparedFetch.whereNotIn('model.id', songIds)
        // }
        preparedFetch.joinRelated('[transfers]', { alias: 't' })
        preparedFetch.where('t.is_owner', '=', true);
        preparedFetch.andWhere('t.transfer_to', '=', user.id);
        preparedFetch.andWhere('model.is_deleted', '=', false);
        preparedFetch.eager('[album, transfers.song.album]')
        let results = await preparedFetch
        results = results.map(song => ({
            ...song, is_album_cover_owner: song.transfers.some(t => t.is_owner && t.transfer_to === user.id)
        }))
        // console.log(results)
        let albumSongs = albums.reduce((acc, album) => [...acc, ...album.songs.map(song => ({ ...song, is_album_cover_owner: song.album.has_copy && song.album.user_id === user.id }))], [])
        results = _.uniqBy([...results, ...albumSongs], 'song_cid')
        let total = results.length
        pageNumber = parseInt(pageNumber)
        perPage = parseInt(perPage)
        results = results.slice((pageNumber * (perPage || 20)), ((perPage || 20)) * (pageNumber + 1))
        return {
            results,
            page: pageNumber,
            per_page: perPage,
            total
        }

    },

    async getSong(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let theSong = await Song.query().findById(id).eager(query.related)

        if (!theSong) {
            throw {
                message: 'Song Not Found',
                statusCode: 404
            }
        }

        return theSong
    },

    async createSong(songBody,) {
        const song = await transaction(
            Song,
            async (Song) => {
                var newSong = await Song.query().insert({
                    ...songBody
                })

                return newSong
            }
        )

        return song

    },
    async sellSong(songBody) {
        if (!songBody.id) {
            throw {
                message: 'Id is not provided',
            }
        }
        if (!songBody.price) {
            throw {
                message: 'price is not provided',
            }
        }
        const transfer = await transaction(
            Transfer,
            async (Transfer) => {
                let token = await Transfer.query().findById(parseInt(songBody.id)).eager('[song.album, transferTo]')
                if (!token) {
                    throw {
                        message: 'Song does not exists'
                    }
                }
                let songtokenid = `${token.song.album.cover_cid}:${token.copy_number}:${token.token}`
                // fetch ammount
                let { USD } = await getNearPriceInUSD()
                let nearPrice = songBody.price / (100 * USD)
                let txnHash = await putNFTForSelling(token.transferTo.near_account_id, songtokenid, nearPrice)
                let transaction = await Transfer.query().patchAndFetchById(token.id, {
                    bidding_price: parseInt(songBody.price),
                    is_for_sale: true,
                    yocto_near_price: parseNearAmount(`${nearPrice}`)
                })
                return {
                    ...transaction
                }
            })
        return transfer
    },
    async buySong(songBody, user) {
        if (!songBody.id) {
            throw {
                message: 'Id is not provided',
            }
        }
        if (!songBody.price) {
            throw {
                message: 'price is not provided',
            }
        }
        let token = await Transfer.query().findById(parseInt(songBody.id)).eager('[song.album, transferTo]')
        if (!token) {
            throw {
                message: 'Song does not exists'
            }
        }
        let songtokenid = `${token.song.album.cover_cid}:${token.copy_number}:${token.token}`
        let txnHash = await buyNFTToken(user.near_account_id, token.yocto_near_price, songtokenid)
        await Transfer.query().patchAndFetchById(token.id, { is_owner: false, is_for_sale: false })
        let { USD } = await getNearPriceInUSD()
        let nearPrice = token.bidding_price / (100 * USD)
        let transfer = await Transfer.query().insert({
            transfer_by: token.transfer_to,
            transfer_to: user.id,
            token: token.token,
            copy_number: token.copy_number,
            type: 'song',
            transaction_hash: txnHash,
            price_in_usd: token.bidding_price,
            yocto_near_price: parseNearAmount(`${nearPrice}`)
        })
        return {
            ...transfer
        }
    },
    async editSong(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedSong = await Song.query().patchAndFetchById(id, { ...newBody })

        if (!editedSong) {
            throw {
                message: 'Song Not Found',
                statusCode: 404
            }
        }

        return editedSong
    },

    async deleteSong(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await Song.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(Song.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'Song Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
