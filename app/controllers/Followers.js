let Follower = require('../models').Follower,
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters')
module.exports = {
    async getFollowers(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, Follower, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getFollower(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let theFollower = await Follower.query().findById(id).eager(query.related)

        if (!theFollower) {
            throw {
                message: 'Follower Not Found',
                statusCode: 404
            }
        }

        return theFollower
    },

    async createFollower(followerBody, userPermissions = {}) {
        const follower = await transaction(
            Follower,
            async (Follower) => {
                var newFollower = await Follower.query().insert({
                    ...followerBody
                })

                return newFollower
            }
        )

        return follower

    },

    async editFollower(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedFollower = await Follower.query().patchAndFetchById(id, { ...newBody })

        if (!editedFollower) {
            throw {
                message: 'Follower Not Found',
                statusCode: 404
            }
        }

        return editedFollower
    },

    async deleteFollower(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await Follower.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(Follower.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'Follower Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
