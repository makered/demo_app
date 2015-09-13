var should = require('should'),
    app = require('../app'),
    request = require('supertest');

var server;

beforeEach(function() {
    server = app.listen();
});

afterEach(function(done) {
    server.close(done);
});

describe('RouteTests', function() {
    it('should return 200 on /', function(done) {
        request(server)
            .get('/')
            .expect(200, done);
    });
    it('should return 200 on /users', function(done) {
        request(server)
            .get('/')
            .expect(200, done);
    });
    it('should return 404 on unrecognized path', function(done) {
        request(server)
            .get('/bogus')
            .expect(404, done);
    });
});
