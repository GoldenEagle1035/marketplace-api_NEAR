let { User, Album, Song, Transfer } = require('../models'),
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters'),
    { getTokenOwner } = require('../lib/near'),
    { ipfsGateway, uploadJSONToPinata } = require('./Upload')
const { getNearPriceInUSD } = require('../lib/near')
const { utils: { format: { parseNearAmount } } } = require('near-api-js')

module.exports = {
    async getUserNFTs(id, query) {
        let mapped = []
        if (query.type === 'album') {
            let relations = 'currentOwner,songs'
            if (query.showcase) {
                relations = relations.replace('currentOwner', 'currentOwner.showcases')
            }
            const userOwnedAlbums = await Album.query().where({ is_deleted: false, current_owner: id }).eager(`[${relations}]`)
            let mappedAlbums = userOwnedAlbums.map(m => ({ ...m, type: 'album' }))
            mapped = [...mappedAlbums]
        } else if (query.type === 'song') {
            let relations = 'currentOwner,album'
            if (query.showcase) {
                relations = relations.replace('currentOwner', 'currentOwner.showcases')
            }
            const userOwnedSongs = await Song.query().where({ is_deleted: false, current_owner: id }).eager(`[${relations}]`)
            let mappedSongs = userOwnedSongs.map(m => ({ ...m, type: 'song' }))
            mapped = [...mappedSongs]
        } else {
            let relations1 = 'currentOwner,album'
            let relations2 = 'currentOwner,songs'
            if (query.showcase) {
                relations1 = relations1.replace('currentOwner', 'currentOwner.showcases')
                relations2 = relations2.replace('currentOwner', 'currentOwner.showcases')
            }
            const userOwnedSongs = await Song.query().where({ is_deleted: false, current_owner: id }).eager(`[${relations1}]`)
            const userOwnedAlbums = await Album.query().where({ is_deleted: false, current_owner: id }).eager(`[${relations2}]`)
            let mappedAlbums = userOwnedAlbums.map(m => ({ ...m, type: 'album' }))
            let mappedSongs = userOwnedSongs.map(m => ({ ...m, type: 'song' }))
            mapped = [...mappedAlbums, ...mappedSongs]
        }
        let total = mapped.length
        return {
            results: mapped,
            total
        }
    },
    async getUserByIdNFTs(id, query) {
        let mapped = []
        if (query.type === 'album') {
            const userOwnedAlbums = await Album.query().where({ is_deleted: false, current_owner: id })
            let mappedAlbums = userOwnedAlbums.map(m => ({ ...m, type: 'album' }))
            mapped = [...mappedAlbums]
        } else if (query.type === 'song') {
            const userOwnedSongs = await Song.query().where({ is_deleted: false, current_owner: id })
            let mappedSongs = userOwnedSongs.map(m => ({ ...m, type: 'song' }))
            mapped = [...mappedSongs]
        } else {
            const userOwnedSongs = await Song.query().where({ is_deleted: false, current_owner: id })
            const userOwnedAlbums = await Album.query().where({ is_deleted: false, current_owner: id })
            let mappedAlbums = userOwnedAlbums.map(m => ({ ...m, type: 'album' }))
            let mappedSongs = userOwnedSongs.map(m => ({ ...m, type: 'song' }))
            mapped = [...mappedAlbums, ...mappedSongs]
        }
        let total = mapped.length
        return {
            results: mapped,
            total
        }
    },
    async getNFTOwner(token, user) {
        let transactionHash = await getTokenOwner(user.near_account_id, token)
        return {
            ...transactionHash,
        }
    },
    async mintToken(body, user) {
        const mint = await transaction(
            Album,
            Song,
            async (Album, Song) => {
                let albumUrl = `${ipfsGateway}/ipfs/${body.cover}`
                // upload metadata for the song
                const albumSchema = {}
                albumSchema['name'] = `${body.title}`
                albumSchema['cover'] = albumUrl
                albumSchema['description'] = `${body.description}`
                let metaObj = await uploadJSONToPinata(albumSchema, body.name + '- Info', {})

                let { USD } = await getNearPriceInUSD()
                let nearPrice = parseInt(body.price / 100) / USD
                let price = parseNearAmount(`${nearPrice}`)

                const album = await Album.query().insert({
                    cid: metaObj.IpfsHash,
                    title: body.title,
                    description: body.description,
                    cover_cid: body.cover,
                    user_id: user.id,
                    current_owner: user.id,
                    price: body.price,
                    has_copy: true,
                    txn_hash: body.txn_hash,
                    qty: body.qty,
                    available_qty: body.qty,
                    yocto_near_price: price,
                    minting_cost: (0.1 * USD).toFixed(2) * 100
                })
                // upload metadata for the song
                let songIpfs = await Promise.all(body.songs.map(song => {
                    let songUrl = `${ipfsGateway}/ipfs/${song.hash}`
                    const songSchema = {}
                    const now = new Date().getTime()
                    songSchema['date'] = now
                    songSchema['name'] = song.title
                    songSchema['album'] = albumUrl
                    songSchema['song_url'] = songUrl
                    return uploadJSONToPinata(songSchema, song.title + '- Info', {})
                }))
                // mint token with song url
                const song = await Promise.all(body.songs.map((s, i) => Song.query().insert({
                    title: s.title,
                    song_cid: s.hash,
                    cid: songIpfs[i].IpfsHash,
                    txn_hash: body.txn_hash,
                    user_id: user.id,
                    current_owner: user.id,
                    available_qty: body.qty,
                    qty: body.qty,
                    has_copy: true,
                    album_id: album.id
                })
                ))
                return body
            })
        return mint
    }
}
