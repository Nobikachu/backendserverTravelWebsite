const User = require('../models/user.model');
const path = require('path');
const app_dir = path.dirname(require.main.filename);
const fs = require('fs');

function validateEmail(email) {
    console.log("Validating");
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    console.log("Validation complete!");
    return re.test(String(email).toLowerCase());

    // if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
    // {
    //     return done(true);
    // }
    // return done(false);
}

exports.userUpdate = function(req, res) {
    let givenName = '';
    let familyName = '';
    let password = '';

    if (req.body.hasOwnProperty('givenName')) {
        givenName = req.body.givenName;
        if (givenName === '') {
            return res.status(400).json({"ERROR": "You MUST fill in the email, username and password."});
        }
    }

    if (req.body.hasOwnProperty('familyName')) {
        familyName = req.body.familyName;
        if (familyName === '') {
            return res.status(400).json({"ERROR": "You MUST fill in the email, username and password."});
        }
    }

    if (req.body.hasOwnProperty('password')) {
        password = req.body.password;
        checkPassword = Number(password);
        if (password === '') {
            return res.status(400).json({"ERROR": "You MUST fill in the email, username and password."});
        }
        if (checkPassword) {
            return res.status(400).json({"ERROR": "Password cannot just contain number!!"});
        }
    }

    if (familyName !== '' || givenName !== '' || password !== '') {
        let id = parseInt(req.params.user_id);
        let token = req.header('X-Authorization');
        User.changeUser(id, token, givenName, familyName, password, function(err, result){
            return res.status(err).json(result);

        });
    } else {
        return res.status(400).json({"ERROR": "You MUST fill in the email, username and password."});
    }

};

exports.userViewPhoto = function(req, res) {
    let id = parseInt(req.params.user_id);
    let photoNameJpeg = id + ".jpeg";
    let photoNamePng = id + ".png";
    let imagePath = app_dir + "/app/storage/photos/";

    User.getPhotoName(id, function(err, photoName) {
        if (err) {
            return res.status(err).json(photoName);
        } else if (photoName === null || photoName === undefined) {
            return res.status(404).json(photoName);
        }
        imagePath = imagePath + photoName;
        console.log(imagePath);
        fs.readFile(imagePath, function(err2, result) {
            if (err2) {
                return res.status(404).send({"ERROR": "Failed to read the file"});
            }
            if (photoName === photoNameJpeg) {
                res.contentType("image/jpeg");
            } else if (photoNamePng === photoName) {
                res.contentType("image/png");
            }
            return res.status(200).send(result);
        });
    });
};

exports.userDeletePhoto = function(req, res) {
    let id = parseInt(req.params.user_id);
    let token = req.header('X-Authorization');
    let imagePath = app_dir + "/app/storage/photos/";

    if (token === undefined || token === null || token === '') {
        return res.status(401).json({"ERROR": "No token is given!!!"});
    }

    User.userPhotoAuthorize(id, token, function(err, result) {
        if (err !== 200) {
            return res.status(err).json(result);
        }
        User.getPhotoName(id, function(err, photoName) {
            if (err) {
                return res.status(err).json(photoName);
            } else if (photoName === null || photoName === undefined) {
                return res.status(404).json(photoName);
            }
            imagePath = imagePath + photoName;

            fs.unlink(imagePath, function(err3) {
                if (err3) {
                    return res.status(404).json({"ERROR": "The following photo could not be deleted"});
                }
                User.userPhotoUpload(id, null, function (err4, message) {
                    return res.status(200).json({"SUCESSFUL": "Image has been deleted"});
                });
            });

        });
    });

};

exports.userUploadPhoto = function(req, res) {
    let id = parseInt(req.params.user_id);
    let token = req.header('X-Authorization');
    const rawBinary = req.body;
    if (token === undefined || token === null || token === '') {
        return res.status(401).json({"ERROR": "No token is given!!!"});
    }
    User.userPhotoAuthorize(id, token, function(err, result){
        if (err !== 200) {
            return res.status(err).json(result);
        }
        let initialPath = "./app/storage/photos/";

        let file_type = req.get('Content-Type');
        let endpoint = '';

        if (file_type === 'image/png') {
            console.log('File-Type=', file_type);
            endpoint = id + ".png";
            // imagePath = imagePath + ".png";
        } else  if (file_type === 'image/jpeg'){
            console.log('File-Type=', file_type);
            // imagePath = imagePath + ".jpeg";
            endpoint = id + ".jpeg";
        }
        console.log(endpoint);
        let imagePath = initialPath + endpoint;
        User.getPhotoName(id, function(err, photoExist) {
            if (err === 400) {
                return res.status(err).json(photoExist);
            }
            console.log(imagePath);
            console.log(err);
            if (photoExist === null || photoExist === undefined) {
                User.userPhotoUpload(id, endpoint, function (err2, message) {
                    if (err2 === 201) {
                        fs.writeFile(imagePath, rawBinary, function(err6){
                            // if (err6) {
                            //     return res.status(404).json({"ERROR": "Failed to write the file"});
                            // }
                            return res.status(err2).json(message);
                        });
                    }

                });
            } else {
                // let oldpath = initialPath + photoExist;
                // fs.unlink(oldpath, function(err3) {
                //     if (err3) {
                //         return res.status(404).json({"ERROR": "Failed to unlink the file"});
                //     }
                //     fs.writeFile(imagePath, rawBinary, function (err5) {
                //         if (err5) {
                //             return res.status(404).json({"ERROR": "Failed to write the file"});
                //         }
                //         return res.status(200).json({"SUCESSFUL": "Image has been replaced"});
                //     });
                // });
                fs.writeFile(imagePath, rawBinary, function(err5) {
                    if (err5) {
                        return res.status(404).json({"ERROR": "Failed to write the file"});
                    }
                    if (endpoint !== photoExist) {
                        let oldpath = initialPath + photoExist;
                        console.log("Old path: " + oldpath);
                        fs.unlink(oldpath, function(err3) {
                            // if (err3) {
                            //     return res.status(404).json({"ERROR": "Failed to unlink the file"});
                            // }
                            User.userPhotoUpload(id, endpoint, function (err4, message) {
                                // req.pipe(fs.createWriteStream(imagePath));
                                return res.status(200).json({"SUCESSFUL": "Image has been replaced"});
                            });
                        });

                    } else {
                        // req.pipe(fs.createWriteStream(imagePath));
                        return res.status(200).json({"SUCESSFUL": "Image has been replaced"});
                    }
                });



            }
        });
        // fs.unlink(imagePath, function(err) {
        //     console.log('Unlinking');
        //     console.log(err);
        //     if (err) {
        //         User.userPhotoUpload(id, endpoint, function (err, message) {
        //             if (err === 201) {
        //                 req.pipe(fs.createWriteStream(imagePath));
        //             }
        //             return res.status(err).json(message);
        //         });
        //     } else {
        //         req.pipe(fs.createWriteStream(imagePath));
        //         return res.status(200).json({"SUCESSFUL": "Image has been replaced"})
        //     }
        //
        // });

    });
};

exports.userIdList = function(req, res) {
    let id = parseInt(req.params.user_id);
    let token = req.header('X-Authorization');
    User.getUserId(id, token, function(err, result){
        res.status(err).json(result);

    });
};

exports.userRegister = function(req, res) {
    let username = '';
    let email = '';
    let givenName = '';
    let familyName = '';
    let password = '';

    if (req.body.hasOwnProperty('username')) {
        username = req.body.username;
    }

    if (req.body.hasOwnProperty('email')) {
        email = req.body.email;
    }

    if (req.body.hasOwnProperty('givenName')) {
        givenName = req.body.givenName;
    }

    if (req.body.hasOwnProperty('familyName')) {
        familyName = req.body.familyName;
    }

    if (req.body.hasOwnProperty('password')) {
        password = req.body.password;
    }
    let checkEmail = validateEmail(email);
    if (checkEmail === false) {
        return res.status(400).send({"ERROR": "The email is not in a valid format"});
    }

    console.log("Checking if the MUST FILL fields are not empty");
    if (email === '' || username === '' || password === '') {
        return res.status(400).send({"ERROR": "You MUST fill in the email, username and password."});
    }

    console.log("All the necessary fields are filled :)");
    User.newUser(username, email, givenName, familyName, password, function(err, result){
        // console.log(err);
        if (err === 201) {
            console.log(username, email, givenName, familyName, password);
            console.log(result);
            let ans = result.pop();
            console.log(ans)
            console.log("Result successfully inserted to the database");
            return res.status(201).json(ans);

        } else {
            console.log("Failed");
            console.log(err);
            return res.sendStatus(err);
        }

    });
};

exports.userLogin = function(req, res) {
    let username = '';
    let email = '';
    let password = '';

    if (req.body.hasOwnProperty('username')) {
        username = req.body.username;
    }

    if (req.body.hasOwnProperty('email')) {
        email = req.body.email;
    }

    if (req.body.hasOwnProperty('password')) {
        password = req.body.password;
    }

    if (email == '' && username == '') {
        res.status(400).send({"ERROR": "Please fill in either username or email address!!!"});
    } else {
        User.authorize(email, username, password, function(err, resultId) {
            if (err == 400) {
                res.status(400).json(resultId);
            } else {
                User.getToken(resultId, function(err, resultToken){
                    if (err == 400) {
                        res.status(400).json(resultToken);
                    }
                    if (resultToken) {
                        res.status(200).json({userId: Number(resultId), token: resultToken.toString()});
                    } else {
                        User.setToken(resultId, function(err, resultNewToken) {
                            if (err == 400) {
                                res.status(400).json(resultNewToken);
                            }
                            res.status(200).json({userId: Number(resultId), token: resultNewToken});

                        });
                    }
                });

            }
        });
    }
};

exports.userLogout = function(req, res) {
    let token = req.header('X-Authorization');
    User.removeToken(token, function(err, message) {
        res.status(err).json(message);
    });

};