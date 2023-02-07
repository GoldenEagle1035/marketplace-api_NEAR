let User = require('../models').User,
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters'),
    _ = require('lodash'),
    jsonwebtoken = require('jsonwebtoken')
module.exports = {
    async getUsers(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, User, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id',
                search: query.search
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getUser(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let theUser = await User.query().findById(id).eager(query.related)

        if (!theUser) {
            throw {
                message: 'User Not Found',
                statusCode: 404
            }
        }

        return _.pick(theUser, ['id', 'name', 'avatar', 'banner', 'type'])
    },

    async createUser(userBody,) {
        const user = await transaction(
            User,
            async (User) => {
                var newUser = await User.query().insert({
                    ...userBody
                })

                return newUser
            }
        )

        return user

    },

    async editUser(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedUser = await User.query().patchAndFetchById(id, { ...newBody })
        let token = jsonwebtoken.sign({
            id: editedUser.id,
            twitter_id: editedUser.twitter_id,
            username: editedUser.username,
            name: editedUser.name,
            avatar: editedUser.avatar,
            banner: editedUser.banner,
            near_connected: editedUser.connected_to_near,
            near_account_id: editedUser.near_account_id,
            type: editedUser.type,
        },
            process.env.JWT_SECRET_KEY,
        )
        if (!editedUser) {
            throw {
                message: 'User Not Found',
                statusCode: 404
            }
        }
        editedUser.token = token
        return editedUser
    },

    async deleteUser(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await User.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(User.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'User Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
