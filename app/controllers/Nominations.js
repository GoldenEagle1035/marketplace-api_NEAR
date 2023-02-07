const { parse } = require('handlebars')
let { Nomination, NominationQueue, User, NominationVote } = require('../models'),
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters'),
    moment = require('moment')
module.exports = {
    async getNominations(query = {}, pageNumber = 0, perPage = 20) {
        query.filter = {
            ...(query.filter || {})
        }
        query.filter.for_month = moment().clone().startOf('month').format('YYYY-MM-DD')
        return {
            ...await filterer(query, Nomination, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getNomination(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let theNomination = await Nomination.query().findById(id).eager(query.related)

        if (!theNomination) {
            throw {
                message: 'Nomination Not Found',
                statusCode: 404
            }
        }

        return theNomination
    },

    async createNomination(nominationBody, user_id) {
        let thisMonth = moment().clone().startOf('month').format('YYYY-MM-DD')
        let doesExist = await Nomination.query().findOne({ for_month: thisMonth, nominee: nominationBody.nominee, nominated_by: user_id, is_in_queue: true })
        if (doesExist) {
            throw {
                message: 'You have already nominated for this month!'
            }
        }
        let nominee = await User.query().findById(parseInt(nominationBody.nominee))
        if (!nominee) {
            throw {
                message: 'Nominee does not exists!'
            }
        }
        if (nominee.type === 'artist') {
            throw {
                message: `${nominee.username} is already an artist`
            }
        }
        const nomination = await transaction(
            Nomination,
            NominationVote,
            async (Nomination, NominationVote) => {
                let wasFound = await Nomination.query().findOne({ for_month: thisMonth, nominee: nominationBody.nominee })
                if (!wasFound) {
                    wasFound = await Nomination.query().insert({ for_month: thisMonth, is_in_queue: true, nominee: nominationBody.nominee, nominated_by: user_id })
                }
                var newNomination = await NominationVote.query().insert({
                    voter_id: user_id,
                    nomination_id: wasFound.id,
                })
                return newNomination
            }
        )

        return nomination

    },

    async editNomination(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedNomination = await Nomination.query().patchAndFetchById(id, { ...newBody })

        if (!editedNomination) {
            throw {
                message: 'Nomination Not Found',
                statusCode: 404
            }
        }

        return editedNomination
    },

    async deleteNomination(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await Nomination.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(Nomination.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'Nomination Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
