let { Transfer, Album } = require('../models'),
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters'),
    _ = require('lodash')
const { utils: { format: { parseNearAmount } }, } = require('near-api-js')

module.exports = {

    async getTransactions(query = {}, pageNumber = 0, perPage = 20, user) {
        // fetch transfered album/songs
        let preparedFetch1 = Transfer.query().where({ is_deleted: false })
        preparedFetch1.andWhere(qb => {
            qb.where({ transfer_by: user.id })
            qb.orWhere({ transfer_to: user.id })
        })
        preparedFetch1.eager('[transferBy, transferTo, album, song.album]')
        let results = await preparedFetch1

        // fetch minted albums
        let preparedFetch2 = Album.query().where({ is_deleted: false, user_id: user.id }).eager('user')


        let results1 = await preparedFetch1
        let results2 = await preparedFetch2

        //filter out the albums bundle transaction
        results1 = _.uniqBy(results1, (each) => {
            return each.transaction_hash
        })
        let total = results1.length + results2.length
        pageNumber = parseInt(pageNumber)
        perPage = parseInt(perPage)
        let sorted = [...results1, ...results2].sort((a, b) => b.created_at - a.created_at)
        results = sorted.slice((pageNumber * (perPage || 20)), ((perPage || 20)) * (pageNumber + 1))
        results = results.map(result => ({
            transfer_to: result.transfer_to,
            transaction_hash: result.type ? result.transaction_hash : result.txn_hash,
            created_at: result.created_at,
            price: result.type ? result.transfer_to !== user.id && result.type !== 'send' ? result.price_in_usd : result.price_in_usd * -1 : result.minting_cost * -1,
            price_in_yocto_near: result.type ? result.transfer_to !== user.id && result.type !== 'send' ? result.yocto_near_price : '-' + result.yocto_near_price : '-' + parseNearAmount('0.1'), // currently 0.1 NEAR is deducted while minting
            type: result.type ? result.type : 'minted',
            is_owner: result.is_owner,
            price_in_usd: result.price_in_usd,
            id: result.id,
            transferBy: result.type ? result.transferBy : result.user,
            transferTo: result.type ? result.transferTo : user,
            cover: result.album ? result.album.cover_cid : result.song && result.song.album ? result.song.album.cover_cid : result.cover_cid,
            title: result.album ? result.album.title : result.song ? result.song.title : result.title,
            description: result.album ? result.album.description : result.song ? result.song.description : result.description,
        }))
        return {
            results,
            page: pageNumber,
            per_page: perPage,
            total
        }
    }
}
