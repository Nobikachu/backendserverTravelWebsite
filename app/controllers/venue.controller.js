const Venue = require('../models/venue.model');
    /*validator = require('../../lib/validator'),
    config = require('../../config/config.js'),
    schema = require('../../config/seng') */
const path = require('path');
//const appDirectory = path.dirName(require.main.filename);
const app_dir = path.dirname(require.main.filename);
const fs = require('fs');

var random = function(){
    return Math.random().toString(36).substr(2);
};
var photoRandomNameFile = function () {
    return random() + random();
}




exports.checkVenue = function (req, res) {
    let venueId = req.params.venue_id;
    Venue.checkVenueExist(venueId, function(err, message) {
        if (err === 404) {
            return res.status(err).json(message);
        } else {
            Venue.getVenueDetails(venueId, function(err2, venueDetails) {
                Venue.getAdmin(venueDetails[0].admin_id, function(err3, adminDetails) {
                    Venue.getCategoryDetails(venueDetails[0].category_id, function(err4, categoryDetails) {
                        Venue.getPhotoDetails(venueId, function(err5, photoCollection) {
                            return res.status(err5).json({"venueName": venueDetails[0].venue_name,
                                "admin": adminDetails[0],
                                "category": categoryDetails[0],
                                "city": venueDetails[0].city,
                                "shortDescription": venueDetails[0].short_description,
                                "longDescription": venueDetails[0].long_description,
                                "dateAdded": venueDetails[0].date_added,
                                "address": venueDetails[0].address,
                                "latitude": venueDetails[0].latitude,
                                "longitude": venueDetails[0].longitude,
                                "photos": photoCollection});
                        });
                    });
                });
            });

        }
    });
};

exports.photoPost = function(req, res) {
    let venueId = req.params.venue_id;
    let token = req.header('X-Authorization');
    let photo = req.files.pop();
    // let description = '';
    // let makePrimary = '';

    if (token === undefined || token === null) {
        return res.status(401).json({"ERROR": "No token is given!!!"});
    }
    Venue.checkToken(token, function(err, userId) {
        if (err) {
            return res.status(err).json({"ERROR": "Token does not match with any of the current user online"});
        }
        Venue.checkVenueExist(venueId, function (err3, errorVenue) {
            if (err3) {
                return res.status(err3).json(errorVenue);
            }
            Venue.checkVenueOwner(userId, venueId, function(err2, isOwner) {
                if (!isOwner) {
                    return res.status(403).json({"ERROR": "You don't have permission to upload images for this venue!"});
                }
                let description = req.body.description;
                let makePrimary = req.body.makePrimary;


                if (description === '' || description === undefined || description === null) {
                    console.log(description);
                    return res.status(400).json({"ERROR": "MUST PROVIDE DESCRIPTION!!"});
                }

                if ((makePrimary.toLowerCase() !== 'true' && makePrimary.toLowerCase() !== 'false') || makePrimary === undefined || makePrimary === null) {
                    return res.status(400).json({"ERROR": "Make primary should be either true or false!!"});
                }
                let photoName = '';
                let initialFileName = '';
                if (makePrimary === true) {
                    initialFileName = 'p' + venueId + '-';
                    makePrimary = 1;
                } else {
                    initialFileName = 'v' + venueId + '-';
                    makePrimary = 0;
                }
                // console.log(req.body.photo.type);
                photoName = initialFileName + photoRandomNameFile();
                console.log(photo);
                if (photo.mimetype === 'image/jpeg') {
                    photoName = photoName + ".jpeg";
                } else if (photo.mimetype === 'image/png'){
                    photoName = photoName + ".png";
                } else {
                    return res.status(400).json({"ERROR": "Invalid file type!!! Must be jpeg or png"});
                }
                Venue.venuePhotoUpload(venueId, photoName, description, makePrimary, function(err, message){
                        let imagePath = app_dir + photoName;
                        if (err2 === 201) {
                            fs.writeFile(imagePath, photo, function(err2){
                                if (err2) {
                                    return res.status(404).json({"ERROR": "Failed to write the file"});
                                }
                                return res.status(err).json(message);
                            });
                        }

                    return res.status(err).json(message);;
                });
                // let file_type = req.get('Content-Type');
                // console.log('File-Type=', file_type);
                // if (req.body.hasOwnProperty('file')) {
                //     let file_type = req.body.file;
                //     console.log('File-Type=', file_type);
                // }


            });
        });


    });
}

exports.reviewPost = function(req, res) {
    let reviewBody = '';
    let starRating = '';
    let costRating = '';
    let venueId = req.params.venue_id;
    let token = req.header('X-Authorization');

    if (token === undefined || token === null) {
        return res.status(401).json({"ERROR": "No token is given!!!"});
    }

    if (req.body.hasOwnProperty('reviewBody')) {
        reviewBody = req.body.reviewBody;
    }

    if (req.body.hasOwnProperty('starRating')) {
        starRating = req.body.starRating;
        if (starRating > 5) {
            return res.status(400).json({"ERROR": "Stars cannot exceed 5."});
        }
        if (starRating % 1 !== 0) {
            return res.status(400).json({"ERROR": "Stars must be a whole number."});
        }
    }
    if (req.body.hasOwnProperty('costRating')) {
        costRating = req.body.costRating;
        if (costRating % 1 !== 0) {
            return res.status(400).json({"ERROR": "Cost rating must be a whole number."});
        }
        if (costRating < 0) {
            return res.status(400).json({"ERROR": "Cost rating cannot be negative."});
        }
    }
    if (starRating === '') {
        return res.status(400).json({"ERROR": "Star rating must be filled!."});
    }
    Venue.checkToken(token, function(err, userId) {
        if (err) {
            console.log(1);
            return res.status(err).json({"ERROR": "Token does not match with any of the current user online"});
            console.log(1);
        }
        Venue.checkVenueOwner(userId, venueId, function(err2, isOwner) {
            console.log(2);
            if (isOwner) {
                return res.status(err2).json({"ERROR": "You cannot review the venue you own!!!!"});
            } else {
                Venue.checkPrevReview(userId, venueId, function(err3, doneReviewPrev) {
                    if (doneReviewPrev) {
                        return res.status(err3).json({"ERROR": "You already placed an review for this place!!!!"});
                    } else {
                        Venue.postReview(venueId, userId, reviewBody, starRating, costRating, function(err4, result) {
                            res.status(err4).json(result);
                        });
                    }
                });
            }
        });

    });

};

exports.venueList = function(req, res) {
    Venue.getVenue(req.query,function(err, result){
        if (err == 400) {
            res.status(400).json(result);
        } else {
            res.json(result);
        }
    });
};


exports.categoryList = function(req, res) {
    Venue.getCategory(function(result){
        res.json(result);
    });
};

exports.editVenue = function(req, res) {
    console.log("Checking Authorisation...........");
    let venueName = '';
    let categoryId  = '';
    let city = '';
    let shortDescription = '';
    let longDescription = '';
    let address = '';
    let latitude = '';
    let longitude = '';
    let token = req.header('X-Authorization');
    let venueId = req.params.venue_id;

    if (req.body.hasOwnProperty('venueName')) {
        venueName = req.body.venueName;
    }

    if (req.body.hasOwnProperty('categoryId')) {
        categoryId = req.body.categoryId;
    }

    if (req.body.hasOwnProperty('city')) {
        city = req.body.city;
    }

    if (req.body.hasOwnProperty('shortDescription')) {
        shortDescription = req.body.shortDescription;
    }

    if (req.body.hasOwnProperty('longDescription')) {
        longDescription = req.body.longDescription;
    }
    if (req.body.hasOwnProperty('address')) {
        address = req.body.address;
    }

    if (req.body.hasOwnProperty('latitude')) {
        latitude = req.body.latitude;
        if (+latitude > 90.0) {
            return res.status(400).json({"ERROR": "Latitude cannot exceed 90.0"});
        }
    }

    if (req.body.hasOwnProperty('longitude')) {
        longitude = req.body.longitude;
        if (+longitude < -180.0) {
            return res.status(400).json({"ERROR": "Longitude cannot be lower than -180.0"});
        }
    }

    if (token === '' || token === undefined) {
        return res.status(401).json({"ERROR": "Token is not given"});
    }
    Venue.checkToken(token, function(err2, userId) {
        if (err2 === 401) {
            return res.status(401).json({"ERROR": "The following token does not match with any of our existing users"});
        }
        Venue.checkVenueAuth(venueId, userId, function(err, message) {
            if (err === 403) {
                return res.status(403).json(message);
            }
            console.log("User Authorised");
            console.log(venueName);
            if (venueName === '' && categoryId === '' && city === '' && shortDescription === '' && longDescription === '' &&
            address === '' && latitude === '' && longitude === '') {
                return res.status(400).json({"ERROR": "No changes are made :/"});
            }
            Venue.updateVenue(venueId, venueName, categoryId, city, shortDescription, longDescription, address, latitude, longitude, function(err3, message) {
                return res.status(err3).json(message);
            });

        });
    });
};

exports.newVenue = function(req, res) {
    let venueName = '';
    let categoryId = '';
    let city = '';
    let shortDescription = '';
    let longDescription = '';
    let address = '';
    let latitude = '';
    let longitude = '';
    let token = req.header('X-Authorization');

    if (req.body.hasOwnProperty('venueName')) {
        venueName = req.body.venueName;
    }

    if (req.body.hasOwnProperty('categoryId')) {
        categoryId = req.body.categoryId;
    }

    if (req.body.hasOwnProperty('city')) {
        city = req.body.city;
    }

    if (req.body.hasOwnProperty('shortDescription')) {
        shortDescription = req.body.shortDescription;
    }

    if (req.body.hasOwnProperty('longDescription')) {
        longDescription = req.body.longDescription;
    }
    if (req.body.hasOwnProperty('address')) {
        address = req.body.address;
    }

    if (req.body.hasOwnProperty('latitude')) {
        latitude = req.body.latitude;
        if (+latitude > 90.0) {
            return res.status(400).json({"ERROR": "Latitude cannot exceed 90.0"});
        }
    }

    if (req.body.hasOwnProperty('longitude')) {
        longitude = req.body.longitude;
        if (+longitude < -180.0) {
            return res.status(400).json({"ERROR": "Longitude cannot be lower than -180.0"});
        }
    }
    if (city === '') {
        return res.status(400).json({"ERROR": "City field must be filled!!!"});
    }
    if (token === '' || token === undefined) {
        return res.status(401).json({"ERROR": "Token is not given"});
    }
    Venue.getCategoryDetails(categoryId, function(err, rows) {
       if (rows.length === 0) {
           return res.status(400).json({"ERROR": "The following category id is not valid"});
       }
       Venue.checkToken(token, function(err2, userId) {
           if (err2 === 401) {
               return res.status(401).json({"ERROR": "The following token does not match with any of our existing users"});
           }
           Venue.newVenue(userId, categoryId, venueName, city, shortDescription, longDescription, address, latitude, longitude, function(err3, venueId) {
               return res.status(err3).json(venueId);
           });
       });
    });
};
