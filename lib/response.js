var events = require('events');
var util = require('util');
var http = require('http');

/**
* Mock response object for receiving content without a server.
**/
var MockResponse = function(callback) {
    if (!(this instanceof MockResponse)) {
        return new MockResponse(callback);
    }

    this.buffer = [];
    this.statusCode = null;
    this._headers = {};
    this.on('data', function(chunk) {
        this.buffer.push(chunk);
    });
    this.on('pipe', function(src) {
        var buffer = this.buffer;

        src.on('data', function(chunk){
            buffer.push(chunk);
        })
    });
    this.on('close', function() {});

    if (callback) {
        var self = this;
        var cleanup = function () {
            self.removeListener('error', cleanup)
            self.removeListener('response', cleanup)

            callback.apply(this, arguments)
        }
        this.once('error', cleanup);
        this.once('response', cleanup);
    }
};

util.inherits(MockResponse, events.EventEmitter);

MockResponse.prototype.write = function(str) {
    this.buffer.push(str);
};
MockResponse.prototype.writeHead = function(statusCode, headers) {
    var that = this;

    this.statusCode = statusCode;
    Object.keys(headers).forEach(function(k) {
        that.setHeader(k, headers[k]);
    });
};
MockResponse.prototype.setHeader = function(name, value, clobber) {
  return http.ServerResponse.prototype.setHeader.call(this, name, value, clobber);
};
MockResponse.prototype.getHeader = function(name) {
  return http.ServerResponse.prototype.getHeader.call(this, name);
};
MockResponse.prototype.end = function(str) {
    this.buffer.push(str);
    this.emit('close');
    this.emit('finish');
    this.emit('end', null, { // deprecate me
        statusCode: this.statusCode,
        body: this.buffer.join(''),
        headers: this._headers
    });
    this.emit('response', null, {
        statusCode: this.statusCode,
        body: this.buffer.join(''),
        headers: this._headers
    });
};

module.exports = MockResponse;
