var _ =           require('underscore')
    , path =      require('path')
    , passport =  require('passport')
    , AuthCtrl =  require('../controllers/auth')
    , UserCtrl =  require('../controllers/user')
    , User =      require('../models/user.js')
    , userRoles = require('../src/js/routingConfig').userRoles
    , accessLevels = require('../src/js/routingConfig').accessLevels;


var routes = [

    // Local Auth
    {
        path: '/register',
        httpMethod: 'POST',
        middleware: [AuthCtrl.register]
    },
    {
        path: '/login',
        httpMethod: 'POST',
        middleware: [AuthCtrl.login]
    },
    {
        path: '/logout',
        httpMethod: 'POST',
        middleware: [AuthCtrl.logout]
    },

    // User resource
    {
        path: '/users',
        httpMethod: 'GET',
        middleware: [UserCtrl.index],
        accessLevel: accessLevels.admin
    },

    // todos resource
    {
        path: '/todos',
        httpMethod: 'GET',
        middleware: [function(req, res){
            res.render('index', { title: 'Express' });
        }]
    },

    // profile resource
    {
        path: '/profile',
        httpMethod: 'GET',
        middleware: [function(req, res) {
            var role = userRoles.user, username = '', firstName = '', lastName = '', email = '';
            if(req.user) {
                role = req.user.role;
                username = req.user.username;
                firstName = req.user.firstName;
                lastName = req.user.latName;
                email = req.user.email;
            }
            res.cookie('user', JSON.stringify({
                'username': username,
                'role': role,
                'firstName' : firstName,
                'lastName' : lastName,
                'email' : email
            }));
            res.render('index');
        }]
    },

    // login resource
    {
        path: '/login',
        httpMethod: 'GET',
        middleware: [function(req, res){
            res.render('index', { title: 'Express' });
        }]
    },

    // signup resource
    {
        path: '/signup',
        httpMethod: 'GET',
        middleware: [function(req, res){
            res.render('index', { title: 'Express' });
        }]
    },

    // All other get requests should be handled by AngularJS's client-side routing system
    {
        path: '/',
        httpMethod: 'GET',
        middleware: [function(req, res) {
            var role = userRoles.public, username = '', firstName = '', lastName = '';
            if(req.user) {
                role = req.user.role;
                username = req.user.username;
                firstName = req.user.firstName;
                lastName = req.user.latName;
            }
            res.cookie('user', JSON.stringify({
                'username': username,
                'role': role,
                'firstName' : firstName,
                'lastName' : lastName
            }));
            res.render('index');
        }]
    }
];


module.exports = function(app, db) {

    _.each(routes, function(route) {
        route.middleware.unshift(ensureAuthorized);
        var args = _.flatten([route.path, route.middleware]);

        switch(route.httpMethod.toUpperCase()) {
            case 'GET':
                app.get.apply(app, args);
                break;
            case 'POST':
                app.post.apply(app, args);
                break;
            case 'PUT':
                app.put.apply(app, args);
                break;
            case 'DELETE':
                app.delete.apply(app, args);
                break;
            default:
                throw new Error('Invalid HTTP method specified for route ' + route.path);
                break;
        }
    });
};

function ensureAuthorized(req, res, next) {
    var role;
    if(!req.user) role = userRoles.public;
    else          role = req.user.role;

    var accessLevel = _.findWhere(routes, { path: req.route.path }).accessLevel || accessLevels.public;

    if(!(accessLevel.bitMask & role.bitMask)) return res.send(403);
    return next();
}