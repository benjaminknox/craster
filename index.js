var spawn = require('child_process').spawn
var mergeImg = require('merge-img')
var fs = require('fs')
var async = require('async')
var tmp = require('tmp')
var glob = require('glob')

var staticServer = require('./static-server')

function captureOptions(options) {
  return {
    path: options.path,
    image: options.image,
    url: options.url,
    color: options.color || 'eeeeee',
    width: options.width || 1000,
    height: options.height || 1000,
    x: options.x || 0,
    y: options.y || 0,
    z: options.z || 0,
    num: options.num || 20,
    port: options.port || 0,
    server: options.server || false,
  }
}

function capture(options, debug, error, progress = null) {
  options = captureOptions(options)

  staticServer.set('port', options.port)
  var server = staticServer.listen(options.port, function() {
    var host = '0.0.0.0'
    var port = server.address().port

    debug('HTTP server listening on ' + host + ':' + port)

    var url = 'http://' + host + ':' + port + '/'
    url += '?url=' + encodeURIComponent(options.url)
    url += '&x=' + options.x
    url += '&y=' + options.y
    url += '&z=' + options.z
    url += '&width=' + options.width
    url += '&height=' + options.height
    url += '&color=' + options.color

    var tmpobj = tmp.dirSync({ unsafeCleanup: true })
    debug('Temporary directory ' + tmpobj.name)

    function phantomLog(str) {
      var match = str.match(/^(\d+)\/\d+: /)
      if (match && progress) {
        progress((parseInt(match[1]) + 1) / options.num)
      } else {
        debug(str)
      }
    }

    var phantomArgs = [
      '--web-security=false',
      __dirname + '/capture.js',
      url,
      tmpobj.name,
      options.num,
      options.width,
      options.height,
    ]

    phantomjsCommand(phantomArgs, phantomLog, debug, error, function(status) {
      if (!options.server) server.close()
      if (status != 0) return error('Command exited with ' + status)

      debug('Captures done')

      mergeImages({
        dir: tmpobj.name,
        finalPath: options.image,
        debug,
        done: function() {
          tmpobj.removeCallback()
        }
      })
    })
  })
}

function phantomjsCommand(args, log, debug, error, onExit) {
  var command = 'node_modules/.bin/phantomjs'

  debug(command + ' ' + args.join(' '))

  var cmd = spawn(command, args)
  cmd.stdout.on('data', function(data) {
    log(data.toString().trim())
  })
  cmd.stderr.on('data', function(data) {
    error(data.toString().trim())
  })
  cmd.on('exit', onExit)
}

function mergeImages({ dir, finalPath, debug, done }) {
  var globPath = dir + '/*.png'
  debug('Merging ' + globPath + ' images to ' + finalPath)

  glob(globPath, {}, function(err, files) {
    if (err) throw err

    mergeImg(files, { direction: true }).then(function(img) {
      img.write(finalPath, function() {
        debug('Merge done: ' + finalPath)
        done()
      })
    })
  })
}

module.exports.capture = capture
