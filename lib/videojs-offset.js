(function(window, vjs) {
  'use strict';

  vjs.plugin('offset', function(options) {
      var start = options.start, end = options.end,
          constructor = this.constructor,
          Player = {
            buffered: constructor.prototype.buffered,
            duration: constructor.prototype.duration,
            currentTime: constructor.prototype.currentTime,
            ended: constructor.prototype.ended
          }, isInvalidParams = function(start, end) {
            return start >= end || start === undefined || end === undefined;
          };


      this.resetOffset_ = function(start, end) {
        this.startTime_ = start;
        this.endTime_ = end;
        this.offsetDuration_ = (start !== undefined && end !== undefined) ? end - start : undefined;
        this.offsetOn_ = this.offsetDuration_ !== undefined;
        this.initialSeek_ = false;
      };

      this.offset = function(start, end) {
        if (!isInvalidParams(start, end)) {
          this.resetOffset_(start, end);
        } else {
          this.resetOffset_();
        }
      };

      this.buffered = function() {
        var buffer = Player.buffered.call(this);
        if (this.offsetOn_ && buffer && buffer.length > 0) {
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

      this.duration = function(seconds) {
        var sD = Player.duration.call(this, seconds);
        if (this.offsetOn_) {
          return (sD < this.endTime_) ? sD - this.startTime_ : this.offsetDuration_;
        } else {
          return sD;
        }
      };

      this.currentTime = function(t) {
        if (this.offsetOn_) {
          if (t!==undefined) {
            var sT = t + this.startTime_;
            Player.currentTime.call(this, (sT>this.endTime_) ? this.endTime_ : sT);
          } else {
            var cT = Player.currentTime.call(this) - this.startTime_;
            return (cT < 0) ? 0 : cT;
          }
        } else {
          return Player.currentTime.call(this, t);
        }
      };

      this.ended = function() {
        if (this.offsetOn_) {
          return this.currentTime() >= this.duration() || Player.ended.call(this);
        } else {
          return Player.ended.call(this);
        }
      };

      this.on('timeupdate', function() {
        if (this.offsetOn_) {
          var cT = this.currentTime(),
              sT = Player.currentTime.call(this);
           if (sT < this.startTime_) {
            this.initialSeek_ = true;
            this.currentTime(0);
          }
          if (cT >= this.duration()) {
            this.pause();
            this.trigger('ended');
          }
        }
      }.bind(this));

      this.on('play', function() {
        if (!this.initialSeek_ && this.offsetOn_) {
          this.initialSeek_ = true;
          this.currentTime(0);
        }
      });

      this.offset(start, end);
  });
})(window, window.videojs);