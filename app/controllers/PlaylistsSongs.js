let PlaylistsSong = require('../models').PlaylistsSong,
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters')
module.exports = {
    async getPlaylistsSongs(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, PlaylistsSong, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getPlaylistsSong(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let thePlaylistsSong = await PlaylistsSong.query().findById(id).eager(query.related)

        if (!thePlaylistsSong) {
            throw {
                message: 'PlaylistsSong Not Found',
                statusCode: 404
            }
        }

        return thePlaylistsSong
    },

    async createPlaylistsSong(playlistssongBody, ) {
        const playlistssong = await transaction(
            PlaylistsSong,
            async (PlaylistsSong) => {
                var newPlaylistsSong = await PlaylistsSong.query().insert({
                    ...playlistssongBody
                })

                return newPlaylistsSong
            }
        )

        return playlistssong

    },

    async editPlaylistsSong(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedPlaylistsSong = await PlaylistsSong.query().patchAndFetchById(id, { ...newBody })

        if (!editedPlaylistsSong) {
            throw {
                message: 'PlaylistsSong Not Found',
                statusCode: 404
            }
        }

        return editedPlaylistsSong
    },

    async deletePlaylistsSong(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await PlaylistsSong.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(PlaylistsSong.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'PlaylistsSong Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
