/*! lg-zoom - v1.1.0 - 2017-08-08
* http://sachinchoolur.github.io/lightGallery
* Copyright (c) 2017 Sachin N; Licensed GPLv3 */
import './style.scss'
/* eslint no-undef: */
(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module unless amdModuleId is set
		define(['jquery'], function(a0) {
			return (factory(a0))
		})
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('jquery'))
	} else {
		factory($)
	}
}(this, function($) {
	(function() {
		'use strict'

		var getUseLeft = function() {
			var useLeft = false
			var isChrome = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)
			if (isChrome && parseInt(isChrome[2], 10) < 54) {
				useLeft = true
			}

			return useLeft
		}

		var defaults = {
			scale: 1,
			zoom: true,
			actualSize: true,
			enableZoomAfter: 300,
			useLeftForZoom: getUseLeft(),
			rotate: false
		}
		var Zoom = function(element) {
			this.core = $(element).data('lightGallery')
			this.core.s = $.extend({}, defaults, this.core.s)

			if (this.core.s.rotate) this.rotate()
			if (this.core.s.zoom && this.core.doCss()) {
				this.init()

				// Store the zoomable timeout value just to clear it while closing
				this.zoomabletimeout = false

				// Set the initial value center
				this.pageX = $(window).width() / 2
				this.pageY = ($(window).height() / 2) + $(window).scrollTop()
			}
			return this
		}
		Zoom.prototype.rotate = function() {
			var self = this
			var times = 0
			var rotateIcon = '<span class="lg-rotate iconfont iconxuanzhuan"></span>'
			var $outer = self.core.$outer
			$outer.find('.lg-toolbar').append(rotateIcon)
			$outer.find('.lg-rotate').on('click.lg', function() {
				var $image = $outer.find('.lg-current .lg-image')
				times++
				var angle = times * 90
				var scale = $image.attr('data-scale') || 1
				$image.css({
					transform: `rotate3d(0,0,1,-${angle}deg) scale3d(${scale},${scale},1)`
				}).attr('data-angle', angle)
				$image.parent().css({
					'transform': 'translate3d(0,0,0)'
				}).attr('data-y', 0).attr('data-x', 0)
			})
		}
		Zoom.prototype.init = function() {
			var _this = this
			var zoomIcons = '<span id="lg-zoom-in" class="lg-icon"></span><span id="lg-zoom-out" class="lg-icon"></span>'

			if (_this.core.s.actualSize) {
				zoomIcons += '<span id="lg-actual-size" class="lg-icon"></span>'
			}

			if (_this.core.s.useLeftForZoom) {
				_this.core.$outer.addClass('lg-use-left-for-zoom')
			} else {
				_this.core.$outer.addClass('lg-use-transition-for-zoom')
			}

			this.core.$outer.find('.lg-toolbar').append(zoomIcons)

			// Add zoomable class
			_this.core.$el.on('onSlideItemLoad.lg.tm.zoom', function(event, index, delay) {
				// delay will be 0 except first time
				var _speed = _this.core.s.enableZoomAfter + delay

				// set _speed value 0 if gallery opened from direct url and if it is first slide
				if ($('body').hasClass('lg-from-hash') && delay) {
					// will execute only once
					_speed = 0
				} else {
					// Remove lg-from-hash to enable starting animation.
					$('body').removeClass('lg-from-hash')
				}

				_this.zoomabletimeout = setTimeout(function() {
					_this.core.$slide.eq(index).addClass('lg-zoomable')
				}, _speed + 30)
			})

			var scale = 1
			/**
			 * @desc Image zoom
			 * Translate the wrap and scale the image to get better user experience
			 *
			 * @param {String} scaleVal - Zoom decrement/increment value
			 */
			var zoom = function(scaleVal) {
				var $image = _this.core.$outer.find('.lg-current .lg-image')
				var _x
				var _y
				var oldScale = ($image.attr('data-scale') || 1) * 1
				var angle = $image.attr('data-angle') || 0
				var direction = angle / 90 % 4 // ?????????1-90??????2-180??????3-270??????0-???
				var $imageHeight = direction === 1 || direction === 3 ? $image.prop('offsetWidth') : $image.prop('offsetHeight')
				var $imageWidth = direction === 0 || direction === 2 ? $image.prop('offsetWidth') : $image.prop('offsetHeight')
				// Find offset manually to avoid issue after zoom
				var offsetX = ($(window).width() - $imageWidth) / 2
				var offsetY = (($(window).height() - $imageHeight) / 2) + $(window).scrollTop()

				_x = _this.pageX - offsetX
				_y = _this.pageY - offsetY

				var x = (scaleVal - 1) * (_x)
				var y = (scaleVal - 1) * (_y)
				$image.css('transform', 'rotate3d(0,0,1,-' + angle + 'deg) scale3d(' + scaleVal + ', ' + scaleVal + ', 1)').attr('data-scale', scaleVal)
				if (!(oldScale < scaleVal)) {
					if (oldScale !== scaleVal) _this.touchendZoom({ x: 0, y: 0 }, { x: 20, y: 20 }, true, true)
				}
				if (_this.core.s.useLeftForZoom) {
					$image.parent().css({
						left: -x + 'px',
						top: -y + 'px'
					}).attr('data-x', x).attr('data-y', y)
				} else {
					// $image.parent().css('transform', `translate3d(-${x}px,-${y}px,0)`).attr('data-x', x).attr('data-y', y);
					// $image.parent().css('transform', `translate3d(0,0,0)`).attr('data-x', 0).attr('data-y', 0);
				}
			}

			var callScale = function() {
				if (scale > 1) {
					_this.core.$outer.addClass('lg-zoomed')
				} else {
					_this.resetZoom()
				}

				if (scale < 1) {
					scale = 1
				}

				zoom(scale)
			}

			var actualSize = function(event, $image, index, fromIcon) {
				var w = $image.prop('offsetWidth')
				var nw
				if (_this.core.s.dynamic) {
					nw = _this.core.s.dynamicEl[index].width || $image[0].naturalWidth || w
				} else {
					nw = _this.core.$items.eq(index).attr('data-width') || $image[0].naturalWidth || w
				}

				var _scale

				if (_this.core.$outer.hasClass('lg-zoomed')) {
					scale = 1
				} else {
					if (nw > w) {
						_scale = nw / w
						scale = _scale || 2
					}
				}

				if (fromIcon) {
					_this.pageX = $(window).width() / 2
					_this.pageY = ($(window).height() / 2) + $(window).scrollTop()
				} else {
					_this.pageX = event.pageX || event.originalEvent.targetTouches[0].pageX
					_this.pageY = event.pageY || event.originalEvent.targetTouches[0].pageY
				}

				callScale()
				setTimeout(function() {
					_this.core.$outer.removeClass('lg-grabbing').addClass('lg-grab')
				}, 10)
			}

			var tapped = false

			// event triggered after appending slide content
			_this.core.$el.on('onAferAppendSlide.lg.tm.zoom', function(event, index) {
				// Get the current element
				var $image = _this.core.$slide.eq(index).find('.lg-image')

				$image.on('dblclick', function(event) {
					actualSize(event, $image, index)
				})

				$image.on('touchstart', function(event) {
					if (!tapped) {
						tapped = setTimeout(function() {
							tapped = null
						}, 300)
					} else {
						clearTimeout(tapped)
						tapped = null
						actualSize(event, $image, index)
					}

					event.preventDefault()
				})
			})

			// Update zoom on resize and orientationchange
			$(window).on('resize.lg.zoom scroll.lg.zoom orientationchange.lg.zoom', function() {
				_this.pageX = $(window).width() / 2
				_this.pageY = ($(window).height() / 2) + $(window).scrollTop()
				zoom(scale)
			})

			$('#lg-zoom-out').on('click.lg', function() {
				if (_this.core.$outer.find('.lg-current .lg-image').length) {
					scale -= _this.core.s.scale
					callScale()
				}
			})

			$('#lg-zoom-in').on('click.lg', function() {
				if (_this.core.$outer.find('.lg-current .lg-image').length) {
					scale += _this.core.s.scale
					callScale()
				}
			})

			$('#lg-actual-size').on('click.lg', function(event) {
				actualSize(event, _this.core.$slide.eq(_this.core.index).find('.lg-image'), _this.core.index, true)
			})

			// Reset zoom on slide change
			_this.core.$el.on('onBeforeSlide.lg.tm', function() {
				scale = 1
				_this.resetZoom()
			})

			// Drag option after zoom
			_this.zoomDrag()

			_this.zoomSwipe()
		}

		// Reset zoom effect
		Zoom.prototype.resetZoom = function() {
			this.core.$outer.removeClass('lg-zoomed')
			this.core.$slide.find('.lg-img-wrap').removeAttr('style data-x data-y')
			this.core.$slide.find('.lg-image').removeAttr('style data-scale')

			// Reset pagx pagy values to center
			this.pageX = $(window).width() / 2
			this.pageY = ($(window).height() / 2) + $(window).scrollTop()
		}

		Zoom.prototype.zoomSwipe = function() {
			var _this = this
			var startCoords = {}
			var endCoords = {}
			var isMoved = false

			// Allow x direction drag
			var allowX = false

			// Allow Y direction drag
			var allowY = false

			_this.core.$slide.on('touchstart.lg', function(e) {
				if (_this.core.$outer.hasClass('lg-zoomed')) {
					var $image = _this.core.$slide.eq(_this.core.index).find('.lg-object')

					allowY = $image.prop('offsetHeight') * $image.attr('data-scale') > _this.core.$outer.find('.lg').height()
					allowX = $image.prop('offsetWidth') * $image.attr('data-scale') > _this.core.$outer.find('.lg').width()
					if ((allowX || allowY)) {
						e.preventDefault()
						startCoords = {
							x: e.originalEvent.targetTouches[0].pageX,
							y: e.originalEvent.targetTouches[0].pageY
						}
					}
				}
			})

			_this.core.$slide.on('touchmove.lg', function(e) {
				if (_this.core.$outer.hasClass('lg-zoomed')) {
					var _$el = _this.core.$slide.eq(_this.core.index).find('.lg-img-wrap')
					var distanceX
					var distanceY

					e.preventDefault()
					isMoved = true

					endCoords = {
						x: e.originalEvent.targetTouches[0].pageX,
						y: e.originalEvent.targetTouches[0].pageY
					}

					// reset opacity and transition duration
					_this.core.$outer.addClass('lg-zoom-dragging')

					if (allowY) {
						distanceY = (-Math.abs(_$el.attr('data-y'))) + (endCoords.y - startCoords.y)
					} else {
						distanceY = -Math.abs(_$el.attr('data-y'))
					}

					if (allowX) {
						distanceX = (-Math.abs(_$el.attr('data-x'))) + (endCoords.x - startCoords.x)
					} else {
						distanceX = -Math.abs(_$el.attr('data-x'))
					}
					if ((Math.abs(endCoords.x - startCoords.x) > 15) || (Math.abs(endCoords.y - startCoords.y) > 15)) {
						if (_this.core.s.useLeftForZoom) {
							_$el.css({
								left: distanceX + 'px',
								top: distanceY + 'px'
							})
						} else {
							_$el.css('transform', `translate3d(${distanceX}px, ${distanceY}px, 0)`)
						}
					}
				}
			})

			_this.core.$slide.on('touchend.lg', function() {
				if (_this.core.$outer.hasClass('lg-zoomed')) {
					if (isMoved) {
						isMoved = false
						_this.core.$outer.removeClass('lg-zoom-dragging')
						_this.touchendZoom(startCoords, endCoords, allowX, allowY)
					}
				}
			})
		}

		Zoom.prototype.zoomDrag = function() {
			var _this = this
			var startCoords = {}
			var endCoords = {}
			var isDraging = false
			var isMoved = false

			// Allow x direction drag
			var allowX = false

			// Allow Y direction drag
			var allowY = false

			_this.core.$slide.on('mousedown.lg.zoom', function(e) {
				// execute only on .lg-object
				var $image = _this.core.$slide.eq(_this.core.index).find('.lg-object')
				var angle = $image.attr('data-angle') || 0
				var imageHeight = $image.prop('offsetHeight')
				var imageWidth = $image.prop('offsetWidth')
				var scale = $image.attr('data-scale') || 1
				var direction = angle / 90 % 4 // ?????????1-90??????2-180??????3-270??????0-???
				allowY = (direction === 1 || direction === 3 ? imageWidth : imageHeight) * scale > _this.core.$outer.find('.lg-inner').height()
				allowX = (direction === 0 || direction === 2 ? imageWidth : imageHeight) * scale > _this.core.$outer.find('.lg-inner').width()
				// if (_this.core.$outer.hasClass('lg-zoomed')) {
				if ($(e.target).hasClass('lg-object') && (allowX || allowY)) {
					e.preventDefault()
					startCoords = {
						x: e.pageX,
						y: e.pageY
					}

					isDraging = true

					// ** Fix for webkit cursor issue https://code.google.com/p/chromium/issues/detail?id=26723
					_this.core.$outer.scrollLeft += 1
					_this.core.$outer.scrollLeft -= 1

					_this.core.$outer.removeClass('lg-grab').addClass('lg-grabbing')
				}
				// }
			})

			$(window).on('mousemove.lg.zoom', function(e) {
				if (isDraging) {
					var _$el = _this.core.$slide.eq(_this.core.index).find('.lg-img-wrap')
					var distanceX
					var distanceY
					var y = (_$el.attr('data-y') || 0) * 1
					var x = (_$el.attr('data-x') || 0) * 1
					isMoved = true
					endCoords = {
						x: e.pageX,
						y: e.pageY
					}
					// reset opacity and transition duration
					_this.core.$outer.addClass('lg-zoom-dragging')
					if (allowY) {
						distanceY = y + (endCoords.y - startCoords.y)
					} else {
						distanceY = y
					}
					if (allowX) {
						distanceX = x + (endCoords.x - startCoords.x)
					} else {
						distanceX = x
					}
					if (_this.core.s.useLeftForZoom) {
						_$el.css({
							left: distanceX + 'px',
							top: distanceY + 'px'
						})
					} else {
						_$el.css('transform', `translate3d(${distanceX}px, ${distanceY}px, 0)`)
					}
				}
			})

			$(window).on('mouseup.lg.zoom', function(e) {
				if (isDraging) {
					isDraging = false
					_this.core.$outer.removeClass('lg-zoom-dragging')

					// Fix for chrome mouse move on click
					if (isMoved && ((startCoords.x !== endCoords.x) || (startCoords.y !== endCoords.y))) {
						endCoords = {
							x: e.pageX,
							y: e.pageY
						}
						_this.touchendZoom(startCoords, endCoords, allowX, allowY)
					}

					isMoved = false
				}

				_this.core.$outer.removeClass('lg-grabbing').addClass('lg-grab')
			})
		}

		Zoom.prototype.touchendZoom = function(startCoords, endCoords, allowX, allowY) {
			var _this = this
			var _$el = _this.core.$slide.eq(_this.core.index).find('.lg-img-wrap')
			var $image = _this.core.$slide.eq(_this.core.index).find('.lg-object')
			var angle = $image.attr('data-angle') || 0
			var direction = angle / 90 % 4 // ?????????1-90??????2-180??????3-270??????0-???
			var $lgInner = _this.core.$outer.find('.lg-inner')
			var $imageHeight = direction === 1 || direction === 3 ? $image.prop('offsetWidth') : $image.prop('offsetHeight')
			var $imageWidth = direction === 0 || direction === 2 ? $image.prop('offsetWidth') : $image.prop('offsetHeight')
			var scale = $image.attr('data-scale') || 1
			var y = (_$el.attr('data-y') || 0) * 1
			var x = (_$el.attr('data-x') || 0) * 1
			var distanceX = x + (endCoords.x - startCoords.x)
			var distanceY = y + (endCoords.y - startCoords.y)
			var maxY = ($lgInner.height() - $imageHeight * scale) / 2
			var minY = -maxY
			var maxX = ($lgInner.width() - $imageWidth * scale) / 2
			var minX = -maxX
			if ((Math.abs(endCoords.x - startCoords.x) > 15) || (Math.abs(endCoords.y - startCoords.y) > 15)) {
				if (allowY) {
					if (distanceY <= maxY) {
						distanceY = maxY
					} else if (distanceY >= minY) {
						distanceY = minY
					}
				}
				if (allowX) {
					if (distanceX <= maxX) {
						distanceX = maxX
					} else if (distanceX >= minX) {
						distanceX = minX
					}
				}
				if ($imageHeight * scale < $lgInner.height()) distanceY = 0
				if ($imageWidth * scale < $lgInner.width()) distanceX = 0
				if (allowY) {
					_$el.attr('data-y', distanceY)
				} else {
					distanceY = _$el.attr('data-y') || 0
				}

				if (allowX) {
					_$el.attr('data-x', distanceX)
				} else {
					distanceX = _$el.attr('data-x') || 0
				}
				if (_this.core.s.useLeftForZoom) {
					_$el.css({
						left: distanceX + 'px',
						top: distanceY + 'px'
					})
				} else {
					_$el.css('transform', `translate3d(${distanceX}px, ${distanceY}px, 0)`)
				}
			}
		}

		Zoom.prototype.destroy = function() {
			var _this = this

			// Unbind all events added by lightGallery zoom plugin
			_this.core.$el.off('.lg.zoom')
			$(window).off('.lg.zoom')
			_this.core.$slide.off('.lg.zoom')
			_this.core.$el.off('.lg.tm.zoom')
			_this.resetZoom()
			clearTimeout(_this.zoomabletimeout)
			_this.zoomabletimeout = false
		}

		$.fn.lightGallery.modules.zoom = Zoom
	})()
}))
