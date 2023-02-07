let { Playlist, PlaylistsSong, Song } = require('../models'),
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters')
module.exports = {
    async getPlaylists(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, Playlist, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getPlaylist(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let thePlaylist = await Playlist.query().findById(id).eager(query.related)

        if (!thePlaylist) {
            throw {
                message: 'Playlist Not Found',
                statusCode: 404
            }
        }

        return thePlaylist
    },

    async createPlaylist(playlistBody,) {
        console.log(playlistBody, 'playlistBody')
        const playlist = await transaction(
            Playlist,
            PlaylistsSong,
            async (Playlist, PlaylistsSong) => {
                var newPlaylist = await Playlist.query().insert({
                    ...playlistBody
                })
                let songIds = playlistBody.songs || []
                let songs = await Song.query().whereIn('id', songIds)
                await Promise.all(songIds.map(songId => PlaylistsSong.query().insert({ song_id: songId, playlist_id: newPlaylist.id })))
                newPlaylist.songs = songs
                return newPlaylist
            }
        )

        return playlist

    },

    async editPlaylist(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedPlaylist = await Playlist.query().patchAndFetchById(id, { ...newBody })

        if (!editedPlaylist) {
            throw {
                message: 'Playlist Not Found',
                statusCode: 404
            }
        }

        return editedPlaylist
    },

    async deletePlaylist(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await Playlist.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(Playlist.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'Playlist Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
