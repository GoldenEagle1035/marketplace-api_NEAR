let { Album, User, Song } = require('../models')


module.exports = {
    async getSearch(query = {}, pageNumber = 0, perPage = 20, user_id) {
        if (!query.q) {
            throw {
                message: 'Provide query to search'
            }
        }
        let results = []

        let artists = await User.query().where('name', 'ilike', `%${query.q}%`).andWhere({ type: 'artist' }).andWhere({ is_deleted: false }).eager('[songs]')
        results.push({
            type: 'artists',
            data: artists.map(a => a.safeValues())
        })
        console.log(query.q)
        let albums = await Album.query().where('title', 'ilike', `%${query.q}%`).andWhere({ is_deleted: false }).eager('[songs,user,transfers]')
        results.push({
            type: 'albums',
            data: albums.map(a => a.safeValues({ user_id }))
        })

        let songs = await Song.query().where('title', 'ilike', `%${query.q}%`).andWhere({ is_deleted: false }).eager('[album, artist, transfers.transferTo]')

        results.push({
            type: 'songs',
            data: songs.map(a => a.safeValues({ user_id, is_for_sale: true }))
        })

        return {
            results
        }

    }
}
