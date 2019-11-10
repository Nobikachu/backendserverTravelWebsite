const db = require('../../config/db');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const saltRounds = 10;



const getHash = function(password, done) {
    // return crypto.pbkdf2Sync(password, salt, 100000, 256, 'sha256').toString('hex');

    // bcrypt.genSalt(saltRounds, function(err, salt) {
    //     bcrypt.hash(password, salt, function(err, hash) {
    //         // Store hash in your password DB.
    //         return done(err, hash);
    //     });
    // });

    var salt = bcrypt.genSaltSync(saltRounds);
    var hash = bcrypt.hashSync(password, salt);
    return done(hash);
    // bcrypt.hash(password, salt, function(err, hash) {
    //     // Store hash in your password DB.
    //     return done(err, hash);
    // });
};

exports.newUser = function(username, email, givenName, familyName, password, done) {
    let sqlQuery =
        'SELECT username, email FROM User ' +
        "WHERE User.username = '" + username + "' OR User.email = '" + email + "';";

    console.log("Checking if the filled username or email is not taken");
    db.getPool().query(sqlQuery, function(err, rows) {
        if (err) {
            console.log(err);
            return done(400, {"ERROR": "Error selecting venue"});
        } else if (rows.length !== 0) {
            console.log("Username or email is already taken");
            return done(400, {"ERROR": "Either username or email is already taken"});
        }
        console.log("Checking if the filled email is valid");

            console.log("Inserting the data");
            getHash(password, function(hashPassword) {
                sqlQuery =
                    "INSERT INTO User" +
                    " (username, email, given_name, family_name, password)" +
                    " VALUES" +
                    " ('" + username + "', '" + email + "', '" + givenName + "', '" + familyName + "', '" + hashPassword + "');";
                console.log("Finalizing");
                db.getPool().query(sqlQuery, function(err, rows2) {
                    if (err) {
                        console.log(err);
                        return done(400, {"ERROR": "Error selecting venue"});
                    }
                    sqlQuery =
                        'SELECT user_id AS userId FROM User ' +
                        "WHERE User.username = '" + username + "';";
                    db.getPool().query(sqlQuery, function(err, rows3) {
                        if (err) {
                            console.log(err);
                            return done(400, {"ERROR": "Error selecting venue"});
                        }
                        return done(201, rows3);
                    });
                });


            });





        //

    });
    // console.log("Checking if the filled email is valid");
    // validateEmail(email, function(validatedEmail) {
    //     if (!validatedEmail) {
    //         return done(400, {"ERROR": "The email is not in a valid format"});
    //     }
    // });
    //
    // //
    // console.log("Inserting the data");
    // getHash(password, function(hashPassword) {
    //     sqlQuery =
    //         "INSERT INTO User" +
    //         " (username, email, given_name, family_name, password)" +
    //         " VALUES" +
    //         " ('" + username + "', '" + email + "', '" + givenName + "', '" + familyName + "', '" + hashPassword + "');";
    // });
    //
    //
    // console.log("Finalizing");
    // db.getPool().query(sqlQuery, function(err, rows) {
    //     if (err) {
    //         console.log(err);
    //         return done(400, {"ERROR": "Error selecting venue"});
    //     }
    //     sqlQuery =
    //         'SELECT user_id AS userId FROM User ' +
    //         "WHERE User.username = '" + username + "' OR User.email = '" + email + "';";
    // });
    //
    // db.getPool().query(sqlQuery, function(err, rows) {
    //     if (err) {
    //         console.log(err);
    //         return done(400, {"ERROR": "Error selecting venue"});
    //     }
    //     return done(200, rows);
    // });

};


exports.changeUser = function(id, token, givenName, familyName, password, done) {

    let sqlQuery =
        'SELECT username, email, given_name , family_name, password, auth_token FROM User ' +
        'WHERE User.user_id = ' + id + ';';

    db.getPool().query(sqlQuery, function(err, rows) {
        if (err) {
            console.log(err);
            return done(400, {"ERROR": "Error selecting venue"});
        } else if (rows.length == 0) {
            return done(404, {"ERROR": "The following user selected does not exist"});
        }

        sqlQuery = "SELECT * FROM User " +
            // "WHERE User.given_name = '" + givenName + "' AND User.family_name = '" + familyName + "';";
            "WHERE User.given_name = '" + givenName + "' AND User.family_name = '" + familyName + "' AND User.password = '" +  password  + "';";
        db.getPool().query(sqlQuery, function(err, rows2) {
            // console.log(sqlQuery);
            // console.log(rows2.length);
            // getHash(password, function(hashPassword2) {
            //     let checkPass = bcrypt.compareSync(rows2[0].password, hashPassword2);
            //     console.log(checkPass);
            //     if (rows2.length !== 0 && checkPass) {
            //         return done(400, {"ERROR": "No changes are provided!!!!"});
            //     }
            // });
            if (rows2.length !== 0) {
                return done(400, {"ERROR": "No changes are provided!!!!"});
            }
            if (rows[0].auth_token === token && token !== null) {
                sqlQuery = "UPDATE User SET ";
                // getHash(password, function(hashPassword2) {
                //     console.log(rows[0].password);
                //     if (rows[0].given_name === givenName && rows[0].family_name === familyName && bcrypt.compareSync(rows[0].password, hashPassword2)) {
                //         return done(400, {"ERROR": "No changes are made!"});
                //     }
                // });
                needComma = 0;
                if (givenName) {
                    sqlQuery = sqlQuery + "given_name = '" + givenName + "'";
                    needComma = 1;
                }
                if (familyName) {
                    if (needComma) {
                        sqlQuery = sqlQuery + ", ";
                    } else {
                        needComma = 1;
                    }
                    sqlQuery = sqlQuery + "family_name = '" + familyName + "'";

                }
                if (password) {
                    // getHash(password, function(hashPassword) {
                    //     if (needComma) {
                    //         sqlQuery = sqlQuery + ", ";
                    //     }
                    //     sqlQuery = sqlQuery + "password = '" + hashPassword + "'";
                    // });

                    if (needComma) {
                        sqlQuery = sqlQuery + ", ";
                    }
                    sqlQuery = sqlQuery + "password = '" + password + "'";
                }
                sqlQuery = sqlQuery + " WHERE User.user_id = " + id + ";";
                db.getPool().query(sqlQuery, function(err, rows3) {
                    if (err) {
                        console.log(err);
                        return done(400, {"ERROR": "Error selecting venue"});
                    } else {
                        return done(200, {"SUCCESSFUL": "Changes are saved"});
                    }
                });
            } else if (token === null|| token === undefined || token === '') {
                return done(401, {"ERROR": "You do not have a permission to edit this!!!"});
            } else {
                return done(403, {"ERROR": "You cannot edit another user's details"});
            }
        });
        });



};



exports.userPhotoUpload = function(id, photoFilename, done) {
    console.log(photoFilename);
    let sqlQuery =
        "UPDATE User SET profile_photo_filename = '" + photoFilename +
        "' WHERE User.user_id = " + id + ";";

    db.getPool().query(sqlQuery, function(err, rows) {
        if (err) {
            console.log(err);
            return done(400, {"ERROR": "Error selecting user"});
        } else if (rows.length == 0) {
            return done(404, {"ERROR": "The following user selected does not exist"});
        }
        return done(201, {"SUCCESSFUL": "Image successfully uploaded"});
    });
};

exports.userPhotoAuthorize = function(id, token, done) {
    let sqlQuery =
        'SELECT auth_token FROM User ' +
        'WHERE User.user_id = ' + id + ';';

    db.getPool().query(sqlQuery, function(err, rows) {
        if (err) {
            console.log(err);
            return done(400, {"ERROR": "Error selecting user"});
        } else if (rows.length == 0) {
            return done(404, {"ERROR": "The following user selected does not exist"});
        }
        if (rows[0].auth_token == token && token) {
            return done(200, '');
        }
        return done(403, {"ERROR": "You do not have permission to upload a image!!!"});
    });
};

exports.getPhotoName = function(id, done) {
    let sqlQuery =
        'SELECT profile_photo_filename FROM User ' +
        'WHERE User.user_id = ' + id + ';';

    db.getPool().query(sqlQuery, function(err, rows) {
        if (err) {
            console.log(err);
            return done(400, {"ERROR": "Error selecting user"});
        } else if (rows.length === 0) {
            return done(404, {"ERROR": "The following user selected does not exist"});
        }else{
            console.log(rows[0].profile_photo_filename);
            return done(0, rows[0].profile_photo_filename);
        }

    });
};

exports.getUserId = function(id, token, done) {
    let sqlQuery =
        'SELECT username, email, given_name , family_name, auth_token FROM User ' +
        'WHERE User.user_id = ' + id + ';';

    db.getPool().query(sqlQuery, function(err, rows) {
        if (err) {
            console.log(err);
            return done(400, {"ERROR": "Error selecting user"});
        } else if (rows.length == 0) {
            return done(404, {"ERROR": "The following user selected does not exist"});
        }
        if (rows[0].auth_token == token && token) {
            return done(200, {username: rows[0].username, email: rows[0].email, givenName: rows[0].given_name, familyName: rows[0].family_name});
        }
        return done(200, {username: rows[0].username, givenName: rows[0].given_name, familyName: rows[0].family_name});
    });
};

exports.authorize = function(email, username,  password, done) {
    let sqlQuery = '';
    if (email == '') {
        sqlQuery =
            'SELECT user_id AS userId, password FROM User ' +
            "WHERE User.username = '"  + username + "';";
    } else if (username == '') {
        sqlQuery =
            'SELECT user_id AS userId, password FROM User ' +
            "WHERE User.email = '" + email + "';";
    } else {
        sqlQuery =
            'SELECT user_id AS userId, password FROM User ' +
            "WHERE User.email = '" + email + "' AND User.username = '" + username + "';";
    }
    db.getPool().query(sqlQuery, function(err, rows) {
        if (err) {
            console.log(err);
            return done(400, {"ERROR": "Error selecting venue"});
        }
        if (rows.length == 0) {
            console.log("Given username is " + username);
            console.log("Given email is " + email);
            return done(400, {"ERROR": "Either Username or Email does not exist"});
        }
        if (password == '') {
            return done(400, {"ERROR": "Please fill in the password!!!!!!"});
        }

        getHash(password, function(hashPassword) {
            if (bcrypt.compareSync(rows[0].password.toString(), hashPassword)) {
                return done(200, rows[0].userId.toString());
            } else {
                return done(400, {"ERROR": "Wrong password. Please try again"})
            }
        });

        // console.log(rows[0].user_salt);
        //
        // if (rows[0].user_salt == null) {
        //     rows[0].user_salt = '';
        // }

        // let saltCrypt = Buffer.from(rows[0].user_salt, 'hex');
        //
        // console.log("Authorizing");

        // console.log(rows[0].password);
        // if (rows[0].password == getHash(password)) {
        //     console.log("Logging in");
        //     return (200, rows);
        // } else {
        //     return (400, {"ERROR": "Incorrect password! Try again!"});
        // }
        //
        // return done(200, rows);
    });
};

exports.getToken = function(id, done) {
    let sqlQuery =
        'SELECT auth_token FROM User ' +
        "WHERE user_id = " + id + ";";
    db.getPool().query(sqlQuery, function(err, rows) {
        if (err) {
            console.log(err);
            return done(400, {"ERROR": "Error selecting venue"});
        }
        if (rows.length == 0) {
            return done(400, {"ERROR": "The following id does not exist"});
        }
        return done(200, rows[0].auth_token);
    });
};


exports.setToken = function(id, done) {
    let token = crypto.randomBytes(16).toString('hex');
    let sqlQuery =
        "UPDATE User SET auth_token = '" + token +
        "' WHERE User.user_id = " + id + ";";
    db.getPool().query(sqlQuery, function(err, rows) {
        if (err) {
            console.log(err);
            return done(400, {"ERROR": "Error selecting venue"});
        }
        if (rows.length === 0) {
            return done(401, {"ERROR": "The following id does not exist"});
        }
        return done(200, token);
    });
};

exports.removeToken = function(token, done) {
    let sqlQuery =
        "UPDATE User SET auth_token = null WHERE auth_token = '" + token +
        "';";
    db.getPool().query(sqlQuery, function(err, rows) {
        if (err) {
            console.log(err);
            return done(400, {"ERROR": "Error selecting venue"});
        }
        if (rows['changedRows'] == 0) {
            return done(401, {"ERROR": "Does not match the token with any of the existing Users!"});
        }
        return done(200, {"SUCCESSFUL": "Logged out now :)"});
    });
};
