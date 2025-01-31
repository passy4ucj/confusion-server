const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Favourites = require('../models/favourite');

const favouriteRouter = express.Router();

favouriteRouter.use(bodyParser.json());

favouriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favourites.findOne({ user: req.user._id})
    .populate('user')
    .populate('dishes')
    .exec((err, favorites) => {
        if (err) return next(err);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    });
})
.post(cors.corsWithOptions, authenticate.verifyUser, 
    (req, res, next) => {
        Favourites.find({})
            .populate('user')
            .populate('dishes')
            .then((favourites) => {
                var user;
                if(favourites)
                    user = favourites.filter(fav => fav.user._id.toString() === req.user.id.toString())[0];
                if(!user) 
                    user = new Favourites({user: req.user.id});
                for(let i of req.body){
                    if(user.dishes.find((d_id) => {
                        if(d_id._id){
                            return d_id._id.toString() === i._id.toString();
                        }
                    }))
                        continue;
                    user.dishes.push(i._id);
                }
                user.save()
                    .then((userFavs) => {
                        Favourites.findById(userFavs._id)
                        .populate('user')
                        .populate('dishes')
                        .then((favorite) => {
                            res.statusCode = 201;
                            res.setHeader("Content-Type", "application/json");
                            res.json(userFavs);
                            console.log("Favourites Created");
                        })
                        
                    }, (err) => next(err))
                    .catch((err) => next(err));
                
            })
            .catch((err) => next(err));
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favourites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favourites.find({})
        .populate('user')
        .populate('dishes')
        .then((favourites) => {
            var favToRemove;
            if (favourites) {
                favToRemove = favourites.filter(fav => fav.user._id.toString() === req.user.id.toString())[0];
            } 
            if(favToRemove){
                favToRemove.remove()
                    .then((result) => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(result);
                    }, (err) => next(err));
                
            } else {
                var err = new Error('You do not have any favourites');
                err.status = 404;
                return next(err);
            }
        }, (err) => next(err))
        .catch((err) => next(err));
});

favouriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favourites.findOne({user: req.user._id})
    .then((favorites) => {
        if (!favorites) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.json({"exists": false, "favorites": favorites});
        }
        else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                return res.json({"exists": false, "favorites": favorites});
            }
            else {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                return res.json({"exists": true, "favorites": favorites});
            }
        }
    })
})
.post(cors.corsWithOptions, authenticate.verifyUser, 
    (req, res, next) => {
        Favourites.find({})
            .populate('user')
            .populate('dishes')
            .then((favourites) => {
                var user;
                if(favourites)
                    user = favourites.filter(fav => fav.user._id.toString() === req.user.id.toString())[0];
                if(!user) 
                    user = new Favourites({user: req.user.id});
                if(!user.dishes.find((d_id) => {
                    if(d_id._id)
                        return d_id._id.toString() === req.params.dishId.toString();
                }))
                    user.dishes.push(req.params.dishId);
                
                user.save()
                    .then((userFavs) => {
                        Favourites.findById(userFavs._id)
                        .populate('user')
                        .populate('dishes')
                        .then((favorite) => {
                            res.statusCode = 201;
                            res.setHeader("Content-Type", "application/json");
                            res.json(userFavs);
                            console.log("Favourites Created");
                        })
                    }, (err) => next(err))
                    .catch((err) => next(err));

            })
            .catch((err) => next(err));
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favourites/:dishId');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favourites.find({})
        .populate('user')
        .populate('dishes')
        .then((favourites) => {
            var user;
            if(favourites)
                user = favourites.filter(fav => fav.user._id.toString() === req.user.id.toString())[0];
            if(user){
                user.dishes = user.dishes.filter((dishid) => dishid._id.toString() !== req.params.dishId);
                user.save()
                    .then((result) => {
                        Favourites.findById(result._id)
                        .populate('user')
                        .populate('dishes')
                        .then((result) => {
                            res.statusCode = 201;
                            res.setHeader("Content-Type", "application/json");
                            res.json(result);
                        })
                    }, (err) => next(err));
                
            } else {
                var err = new Error('You do not have any favourites');
                err.status = 404;
                return next(err);
            }
        }, (err) => next(err))
        .catch((err) => next(err));
});

module.exports = favouriteRouter;