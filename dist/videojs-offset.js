/*! videojs-offset - v0.3.0 - 2016-12-22*/
(function(window, vjs) {
  'use strict';
  // Extend Default HTML5 and Flash tech
  var Flash = vjs.getComponent('Flash'),
      Html5 = vjs.getComponent('Html5');

  Flash.prototype.supportsStarttime = function() {
    return true;
  };

  Flash.prototype.starttime = function(starttime) {
    if (starttime !== undefined && starttime > 0) {
      if (this.seekable().length) {
        this.setCurrentTime(starttime);
      } else {
        setTimeout(this.starttime.bind(this, starttime), 10);
      }
    }
  };

  Html5.prototype.supportsStarttime = function() {
    return false;
  };

  vjs.plugin('offset', function(options) {
      var start = options.start, end = options.end, starttime = options.starttime,
          constructor = this,
          Player = {
            buffered: constructor.buffered,
            duration: constructor.duration,
            currentTime: constructor.currentTime,
            ended: constructor.ended
          }, isInvalidParams = function(start, end) {
            return start >= end || start === undefined || end === undefined;
          };

      this.resetOffset_ = function(start, end) {
        this.offset_ = {
          start: start,
          end: end,
          duration: (start !== undefined && end !== undefined) ? end - start : undefined,
          ended: false
        };
      };

      this.applyStarttime_ = function() {
        if (this.starttime_ !== undefined) {
          if (this.techGet_('supportsStarttime')) {
            this.techCall_('starttime', this.starttime_ + ((this.offset_) ? this.offset_.start : 0));
          } else {
            this.one('timeupdate', function() {
              if (this.offset_) {
                if (!(this.starttime_ === 0 &&  this.offset_.start === 0)) {
                  this.currentTime(this.starttime_); 
                }
              } else if (this.starttime_ !== 0) {
                this.currentTime(this.starttime_);
              }
            });
          }
        }
      };

      this.setStartTime_ = function(starttime) {
        if (starttime === undefined) {
          return this.starttime_;
        } else {
          this.starttime_ = starttime;
        }

        if (this.isReady_) {
          this.applyStarttime_();
        }
      };

      this.offset = function(start, end, starttime) {
        if (!isInvalidParams(start, end)) {
          this.resetOffset_(start, end);
          this.setStartTime_((starttime !== undefined) ? starttime : 0);
        } else {
          this.offset_ = undefined;
          if (starttime !== undefined) {
            this.setStartTime_(starttime);
          }
        }
      };

      this.buffered = function() {
        var buffer = Player.buffered.call(this);
        if (this.offset_ && buffer && buffer.length > 0) {
          return {
            length: buffer.length,
            _buffer: buffer,
            _offset: this.offset_,

            start : function(range) {
              var s = this._buffer.start(range) - this._offset.start;
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

      this.duration = function(seconds) {
        if (this.offset_ && seconds === undefined) {
          var sD = Player.duration.call(this);
          return (sD < this.offset_.end) ? sD - this.offset_.start : this.offset_.duration;
        } else if (seconds === undefined) {
          return Player.duration.call(this);
        } else {
          Player.duration.call(this, seconds);
        }
      };

      this.currentTime = function(t) {
        if (this.offset_) {
          if (t!==undefined) {
            var sT = t + this.offset_.start;
            Player.currentTime.call(this, (sT>this.offset_.end) ? this.offset_.end : sT);
          } else {
            var cT = Player.currentTime.call(this) - this.offset_.start;
            return (cT < 0) ? 0 : cT;
          }
        } else if (t === undefined) {
          return Player.currentTime.call(this);
        } else {
          Player.currentTime.call(this, t);
        }
      };

      this.ended = function() {
        return (this.offset_) ? this.offset_.ended : Player.ended.call(this);
      };

      this.on('timeupdate', function() {
        if (this.offset_) {
          if (this.currentTime() >= this.offset_.duration) {
            this.pause();
            this.offset_.ended = true;
            this.trigger('ended');
          } else {
            this.offset_.ended = false;
          }
        }
      }.bind(this));

      this.offset(start, end, starttime);

      this.on('ready', function() {
        this.applyStarttime_();
      });
  });
})(window, window.videojs);