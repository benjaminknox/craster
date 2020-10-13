const args = require('system').args
const async = require('async')
const page = require('webpage').create()

// Handle HTTP timeouts
page.settings.resourceTimeout = 60 * 1000 // 60 seconds
page.onResourceTimeout = function(request) {
  message = 'Timed out resource at ' + request.url + '. '
  message += 'Code: ' + request.errorCode + '. '
  message += 'Error: ' + request.errorString

  console.log(message)
  phantom.exit(1);
}

function delay(duration, callback) {
  setTimeout(callback, duration)
}

function waitUntil(conditionCallback, done) {
  if (conditionCallback()) {
    done()
  } else {
    delay(10, function() {
      waitUntil(conditionCallback, done)
    })
  }
}

// Rotation by calling the 3D Viewer through the DOM
function rotateY(y) {
  window.viewer.rotate(0, y, 0)
  window.viewer.update()
}

function isLoadingComplete() {
  return page.evaluate(function() {
    return window._loadingComplete
  })
}

function integers(total) {
  const results = []
  for (var i = 0; i < total; i += 1) {
    results.push(i)
  }
  return results
}

function capture(url, tmpDir, total, width, height) {
  const increment = 360 / total

  function imagePath(num) {
    return tmpDir + '/craster-' + num + '.png'
  }

  function rotator(index, callback) {
    const rotation = index * increment
    console.log(index + '/' + total + ': Rotate to ' + rotation)
    page.evaluate(rotateY, increment)
    delay(20, function() {
      page.render(imagePath(index))
      callback()
    })
  }

  function start() {
    console.log('Starting captures in ' + tmpDir + '...')
    page.evaluate(rotateY, 0)
    delay(20, function() {
      async.eachSeries(integers(total), rotator, function() {
        phantom.exit()
      })
    })
  }

  page.viewportSize = { width: width, height: height }
  page.paperSize = { width: width, height: height }
  page.clipRect = { top: 0, left: 0, width: width, height: height }

  page.onConsoleMessage = function(msg) { console.log('console: ' + msg) }
  page.open(url, function() {
    console.log('Wait until loading complete...')
    waitUntil(isLoadingComplete, function() {
      delay(200, start)
    })
  })
}

if (args.length != 6) {
  console.log('Usage: phantomjs capture.js URL TMP_DIR TOTAL WIDTH HEIGHT')
  phantom.exit(1)
} else {
  const url = args[1]
  const tmpDir = args[2]
  const total = parseInt(args[3], 10)
  const width = parseInt(args[4], 10)
  const height = parseInt(args[5], 10)
  capture(url, tmpDir, total, width, height)
}
