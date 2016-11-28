# Videojs Offset Plugin

<img align="right" height="30" src="http://www.srgssr.ch/fileadmin/templates/images/SRGLogo.gif">

> An Offset plugin for video.js

This plugin allows to play a section of a video.

- [Getting Started](#getting-started)

## Getting Started

Download videojs-offset and include it in your page along with video.js:

```html
<video id="example-video" width=600 height=300 class="video-js vjs-default-skin" controls>
  <source
     src="http://example.com/index.mp4"
     type="video/mp4">
</video>
<script src="video.js"></script>
<script src="videojs-offset.js"></script>
<script>
videojs('example-video', { plugins: { offset: { start: 12, end: 20 } } });
</script>
```