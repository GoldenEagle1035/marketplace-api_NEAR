const { Nomination } = require('../models'),
    moment = require('moment')

module.exports = {
    clearNominationQueue: async function () {
        //since this runs on first of each month, we have to consider the last month to clear
        let prevMonth = moment().startOf('month').subtract(1, 'days').startOf('month')
        await Nomination.query().patch({ is_in_queue: false }).where({ for_month: prevMonth })
    }
}