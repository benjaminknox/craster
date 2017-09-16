container = document.getElementsByTagName('canvas')[0]
color = container.attributes['data-3dviewer-color']?.value
url = container.attributes['data-3dviewer-url']?.value
x = container.attributes['data-3dviewer-x']?.value
y = container.attributes['data-3dviewer-y']?.value
z = container.attributes['data-3dviewer-z']?.value

# See also https://code.google.com/p/jsc3d/wiki/StartupParameters
viewer = new JSC3D.Viewer(container)

# Make it accessible to the browser
window.viewer = viewer

viewer.setParameter 'SceneUrl', url
viewer.setParameter 'ModelColor', "##{color}"
viewer.setParameter 'InitRotationX', x
viewer.setParameter 'InitRotationY', y
viewer.setParameter 'InitRotationZ', z
viewer.setParameter 'RenderMode', 'flat' # can be 'smooth'
viewer.setParameter 'Renderer', 'webgl'
viewer.setParameter 'Background', 'off'
viewer.setParameter 'ProgressBar', 'off'
viewer.onloadingcomplete = ->
  window._loadingComplete = true

console.log("JSC3D init #{url}")
viewer.init()
viewer.update()
