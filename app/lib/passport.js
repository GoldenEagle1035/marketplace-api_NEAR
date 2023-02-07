const passport = require('passport')
const TwitterStrategy = require('passport-twitter'),
    { User } = require('../models'),
    jsonwebtoken = require('jsonwebtoken')

passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: `${process.env.TWITTER_OAUTH_URL}/auth/twitter/callback`
},
    async function (token, tokenSecret, profile, cb) {
        console.log(profile, 'profile')
        let user = await User.query().findOne({ twitter_id: profile.id, is_deleted: false })
        if (!user) {
            let u = await User.query().insert({
                twitter_id: profile.id,
                name: profile.displayName,
                username: profile.username,
                avatar: profile._json.profile_image_url && profile._json.profile_image_url.replace('normal', '400x400'),
                banner: profile._json.profile_banner_url
            });
            profile.user_id = u.id
        } else {
            if (user.avatar !== (profile._json.profile_image_url && profile._json.profile_image_url.replace('normal', '400x400'))) {
                await User.query().patchAndFetchById(user.id, {
                    avatar: profile._json.profile_image_url && profile._json.profile_image_url.replace('normal', '400x400'),
                });
            }
            profile.near_connected = user.connected_to_near || false
            profile.near_account_id = user.near_account_id || null
            profile.user_id = user.id
            profile.type = user.type
            profile.profile_banner_url = user.banner
        }
        return cb(null, profile);
    }
));

module.exports = passport