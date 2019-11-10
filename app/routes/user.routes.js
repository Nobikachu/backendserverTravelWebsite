const user = require('../controllers/user.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users')
         .post(user.userRegister);
    app.route(app.rootUrl + '/users/login')
        .post(user.userLogin);
    app.route(app.rootUrl + '/users/logout')
        .post(user.userLogout);
    app.route(app.rootUrl + '/users/:user_id')
        .get(user.userIdList)
        .patch(user.userUpdate);
    app.route(app.rootUrl + '/users/:user_id/photo')
        .put(user.userUploadPhoto)
        .delete(user.userDeletePhoto)
        .get(user.userViewPhoto);

};