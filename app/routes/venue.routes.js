const venue = require('../controllers/venue.controller');
const multer = require('multer');
var retrieveInfo = multer({dest: 'app/storage/photos'});

module.exports = function (app) {
    app.route(app.rootUrl + '/venues')
        .get(venue.venueList)
        .post(venue.newVenue);

    app.route(app.rootUrl + '/venues/:venue_id')
        .get(venue.checkVenue)
        .patch(venue.editVenue);

    app.route(app.rootUrl + '/venues/:venue_id/reviews')
        .post(venue.reviewPost);

    app.route(app.rootUrl + '/venues/:venue_id/photos')
        .post(retrieveInfo.any(), venue.photoPost);

    app.route(app.rootUrl + '/categories')
        .get(venue.categoryList);

};