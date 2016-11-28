/*! videojs-offset - v0.0.1 - 2016-11-28*/
(function(window, vjs) {
  'use strict';

  vjs.plugin('offset', function(options) {
      var start = options.start, end = options.end;
      if (start >= end || start === undefined || end === undefined) {
        // Log fuck and go
      } else {
        var constructor = this.constructor,
            Player = {
              buffered: constructor.prototype.buffered,
              duration: constructor.prototype.duration,
              currentTime: constructor.prototype.currentTime,
              ended: constructor.prototype.ended
            };

        this.offset = function(start, end) {
          this.startTime_ = start;
          this.endTime_ = end;
          this.offsetDuration_ = end - start;
          this.initialSeek_ = false;
        };

        this.offset(start, end);

        this.buffered = function() {
          var buffer = Player.buffered.apply(this, arguments);
          if (buffer) {
            return {
              length: buffer.length,
              _buffer: buffer,
              _offset: {start: this.startTime_, end: this.endTime_},

              start : function(range) {
                var s = this._buffer.start(range) - this._offset.start
                return (s < 0) ? 0 : s;
              },
              end: function(range) {
                var e = this._buffer.end(range) - this._offset.start;
                return (e > this._offset.end) ? this._offset.end : e;
              }
            };
          }
          return buffer;
        };

        this.duration = function() {
          return this.offsetDuration_;
        };

        this.currentTime = function(t) {
          if (t!==undefined) {
            var sT = t + this.startTime_;
            Player.currentTime.apply(this, [(sT>this.endTime_) ? this.endTime_ : sT]);
          } else {
            var sT = Player.currentTime.apply(this), cT = sT - this.startTime_;
            return (cT < 0) ? 0 : cT;
          }
        };

        this.ended = function() {
          var cT = this.currentTime();
          return cT >= this.offsetDuration_ || Player.ended.apply(this, arguments);
        };

        this.on('timeupdate', function() {
          var cT = this.currentTime();
          if (cT >= this.offsetDuration_) {
            this.pause();
            this.trigger('ended');
          }
        }.bind(this));

        this.on('play', function() {
          if (!this.initialSeek_) {
            this.currentTime(0);
            this.initialSeek_ = true;
          }
        });
      }
  });
})(window, window.videojs);