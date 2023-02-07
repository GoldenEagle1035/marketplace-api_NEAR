const { accountCreator } = require('near-api-js')
let { Transfer, } = require('../models'),
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters'),
    _ = require('lodash')
module.exports = {
    async getMarketplaceSongs(query = {}, pageNumber = 0, perPage = 20) {
        query.filter = {
            ...(query.filter || {})
        }
        query.filter.type = 'song'
        query.filter.is_for_sale = true
        query.related = '[song.[album,artist], transferTo]'
        let data = await filterer(query, Transfer, {
            pageNumber,
            perPage,
            related: query.related,
            orderBy: query.orderBy || 'id'
        })
        data.results = data.results.map(result => result.safeValues({}))
        data.results = data.results.reduce((acc, cur) => {
            let found = acc.find(f => f.id === cur.song.id)
            if (found) {
                found.transfers.push({ ...cur, song: undefined, })
            } else {
                acc = [...acc, { ...cur.song, transfers: [{ ...cur, song: undefined, }] }]
            }
            return acc
        }, [])

        return {
            ...data,
            page: pageNumber,
            per_page: perPage
        }

    },

    async getMarketplaceSong(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let theMarketplaceSong = await MarketplaceSong.query().findById(id).eager(query.related)

        if (!theMarketplaceSong) {
            throw {
                message: 'Song Not Found',
                statusCode: 404
            }
        }

        return theMarketplaceSong
    },
}
