let { NominationVote, Nomination } = require('../models'),
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters')

module.exports = {
    async getNominationVotes(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, NominationVote, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getNominationVote(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let theNominationVote = await NominationVote.query().findById(id).eager(query.related)

        if (!theNominationVote) {
            throw {
                message: 'NominationVote Not Found',
                statusCode: 404
            }
        }

        return theNominationVote
    },

    async createNominationVote(nominationvoteBody, user_id) {
        let doesExist = await NominationVote.query().findOne({ voter_id: user_id, nomination_id: nominationvoteBody.nomination_id })
        if (doesExist) {
            throw {
                message: 'You have already nominated for this month!'
            }
        }
        const nominationvote = await transaction(
            NominationVote,
            async (NominationVote) => {
                var newNominationVote = await NominationVote.query().insert({
                    ...nominationvoteBody,
                    voter_id: user_id,
                })

                return newNominationVote
            }
        )

        return nominationvote

    },

    async editNominationVote(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedNominationVote = await NominationVote.query().patchAndFetchById(id, { ...newBody })

        if (!editedNominationVote) {
            throw {
                message: 'NominationVote Not Found',
                statusCode: 404
            }
        }

        return editedNominationVote
    },

    async deleteNominationVote(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await NominationVote.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(NominationVote.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'NominationVote Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
