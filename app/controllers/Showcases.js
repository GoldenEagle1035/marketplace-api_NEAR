let { Showcase, Album } = require('../models'),
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters')
module.exports = {
    async getShowcases(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, Showcase, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getShowcase(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let theShowcase = await Showcase.query().findById(id).eager(query.related)

        if (!theShowcase) {
            throw {
                message: 'Showcase Not Found',
                statusCode: 404
            }
        }
        return theShowcase
    },

    async createShowcase(showcaseBody,) {
        const showcase = await transaction(
            Showcase,
            async (Showcase) => {
                let showcases = await Showcase.query().where({ is_deleted: false, album_id: showcaseBody.album_id, user_id: showcaseBody.user_id })
                if (showcases.length) {
                    throw {
                        message: 'This album is already added to your showcase'
                    }
                }
                var newShowcase = await Showcase.query().insert({
                    ...showcaseBody
                })
                newShowcase.album = await Album.query().findById(showcaseBody.album_id)
                return newShowcase
            }
        )

        return showcase

    },

    async editShowcase(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedShowcase = await Showcase.query().patchAndFetchById(id, { ...newBody })

        if (!editedShowcase) {
            throw {
                message: 'Showcase Not Found',
                statusCode: 404
            }
        }

        return editedShowcase
    },

    async deleteShowcase(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await Showcase.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(Showcase.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'Showcase Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
