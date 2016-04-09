( function () {

	/**
	 * Information spot attached to panorama
	 * @constructor
	 * @param {number} [scale=1] - Infospot scale
	 * @param {imageSrc} [imageSrc=PANOLENS.DataImage.Info] - Image overlay info
	 */
	PANOLENS.Infospot = function ( scale, imageSrc ) {
		
		var scope = this, ratio, startScale, endScale, duration;

		scale = scale || 1;
		imageSrc = imageSrc || PANOLENS.DataImage.Info;
		duration = 500;

		THREE.Sprite.call( this );

		this.type = 'infospot';

		this.isHovering = false;
		this.visible = false;

		this.element;
		this.toPanorama;

		this.mode = PANOLENS.Modes.UNKNOWN;

		this.scale.set( scale, scale, 1 );
		this.rotation.y = Math.PI;

		this.container;

		PANOLENS.Utils.TextureLoader.load( imageSrc, postLoad );		

		function postLoad ( texture ) {
			
			scope.material.side = THREE.DoubleSide;
			scope.material.map = texture;
			scope.material.depthTest = false;

			texture.wrapS = THREE.RepeatWrapping;
			texture.repeat.x = - 1;

			ratio = texture.image.width / texture.image.height;

			scope.scale.set( ratio * scale, scale, 1 );

			startScale = scope.scale.clone();
			endScale = scope.scale.clone().multiplyScalar( 1.3 );
			endScale.z = 1;

			scope.scaleUpAnimation = new TWEEN.Tween( scope.scale )
				.to( { x: endScale.x, y: endScale.y }, duration )
				.easing( TWEEN.Easing.Elastic.Out );

			scope.scaleDownAnimation = new TWEEN.Tween( scope.scale )
				.to( { x: startScale.x, y: startScale.y }, duration )
				.easing( TWEEN.Easing.Elastic.Out );

		}

		function show () {

			this.visible = true;

		}

		function hide () {

			this.visible = false;

		}

		// Add show and hide animations
		this.showAnimation = new TWEEN.Tween( this.material )
			.to( { opacity: 1 }, duration )
			.onStart( show.bind( this ) )
			.easing( TWEEN.Easing.Quartic.Out );

		this.hideAnimation = new TWEEN.Tween( this.material )
			.to( { opacity: 0 }, duration )
			.onComplete( hide.bind( this ) )
			.easing( TWEEN.Easing.Quartic.Out );

		// Attach event listeners
		this.addEventListener( 'click', this.onClick );
		this.addEventListener( 'hover', this.onHover );
		this.addEventListener( 'hoverenter', this.onHoverStart );
		this.addEventListener( 'hoverleave', this.onHoverEnd );
		this.addEventListener( 'VR-toggle', this.onToggleVR );
		this.addEventListener( 'panolens-container', this.setContainer.bind( this ) );

	}

	PANOLENS.Infospot.prototype = Object.create( THREE.Sprite.prototype );

	PANOLENS.Infospot.prototype.setContainer = function ( data ) {

		var container;

		if ( data instanceof HTMLElement ) {

			container = data;

		} else if ( data && data.container ) {

			container = data.container;

		}

		// Append element if exists
		if ( container && this.element ) {

			container.appendChild( this.element );

		}

		this.container = container;

	};

	/**
	 * This will be called by a click event
	 * Translate and lock the hovering element if any
	 * @param  {object} event - Event containing mouseEvent with clientX and clientY
	 */
	PANOLENS.Infospot.prototype.onClick = function ( event ) {

		if ( this.element ) {

			this.translateElement( event.mouseEvent.clientX, event.mouseEvent.clientY );

			// Lock element
			this.lockHoverElement();

		}

	};

	/**
	 * This will be called by a mouse hover event
	 * Translate the hovering element if any
	 * @param  {object} event - Event containing mouseEvent with clientX and clientY
	 */
	PANOLENS.Infospot.prototype.onHover = function ( event ) {

		if ( this.element && !this.element.locked ) {

			this.translateElement( event.mouseEvent.clientX, event.mouseEvent.clientY );

		}

	};

	/**
	 * This will be called on a mouse hover start
	 * Sets cursor style to 'pointer', display the element and scale up the infospot
	 */
	PANOLENS.Infospot.prototype.onHoverStart = function ( event ) {

		this.isHovering = true;
		this.container.style.cursor = this.mode === PANOLENS.Modes.VR ? 'default' : 'pointer';
		this.scaleDownAnimation.stop();
		this.scaleUpAnimation.start();

		if ( this.element ) {

			if ( this.mode === PANOLENS.Modes.VR ) {

				this.element.style.display = 'none';
				this.element.left && ( this.element.left.style.display = 'block' );
				this.element.right && ( this.element.right.style.display = 'block' );

				// Store element width for reference
				this.element._width = this.element.left.clientWidth;
				this.element._height = this.element.left.clientHeight;

			} else {

				this.element.style.display = 'block';
				this.element.left && ( this.element.left.style.display = 'none' );
				this.element.right && ( this.element.right.style.display = 'none' );

				// Store element width for reference
				this.element._width = this.element.clientWidth;
				this.element._height = this.element.clientHeight;

			}

			this.translateElement( event.mouseEvent.clientX, event.mouseEvent.clientY );
			
		}

	};

	/**
	 * This will be called on a mouse hover end
	 * Sets cursor style to 'default', hide the element and scale down the infospot
	 */
	PANOLENS.Infospot.prototype.onHoverEnd = function () {

		this.isHovering = false;
		this.container.style.cursor = 'default';
		this.scaleUpAnimation.stop();
		this.scaleDownAnimation.start();

		if ( this.element ) {

			this.element.style.display = 'none';
			this.element.left && ( this.element.left.style.display = 'none' );
			this.element.right && ( this.element.right.style.display = 'none' );

			this.unlockHoverElement();

		}

	};

	PANOLENS.Infospot.prototype.onToggleVR = function ( event ) {
		
		var element, halfWidth, halfHeight;

		this.mode = event.mode;

		element = this.element;

		halfWidth = this.container.clientWidth / 2;
		halfHeight = this.container.clientHeight / 2;

		if ( !element ) {

			return;

		}

		if ( !element.left || !element.right ) {

			element.left = element.cloneNode( true );
			element.right = element.cloneNode( true );

		}

		if ( this.mode === PANOLENS.Modes.VR ) {

			element.left.style.display = element.style.display;
			element.right.style.display = element.style.display;
			element.style.display = 'none';

		} else {

			element.style.display = element.left.style.display;
			element.left.style.display = 'none';
			element.right.style.display = 'none';

		}

		// Update elements translation
		this.translateElement( halfWidth, halfHeight );

		this.container.appendChild( element.left );
		this.container.appendChild( element.right );

	}

	/**
	 * Translate the hovering element by css transform
	 * @param  {number} x - X position on the window screen
	 * @param  {number} y - Y position on the window screen
	 */
	PANOLENS.Infospot.prototype.translateElement = function ( x, y ) {

		if ( !this.element._width || !this.element._height ) {

			return;

		}

		var left, top, element, width, height, delta, container;

		container = this.container;
		element = this.element;
		width = element._width / 2;
		height = element._height;
		delta = 30;

		left = x - width;
		top = y - height - delta;

		if ( this.mode === PANOLENS.Modes.VR && element.left && element.right ) {

			left = container.clientWidth / 4 - width;
			top = container.clientHeight / 2 - height - delta;

			this.setCSSStyle( 'transform', element.left, 'translate(' + left + 'px, ' + top + 'px)' );

			left += container.clientWidth / 2;

			this.setCSSStyle( 'transform', element.right, 'translate(' + left + 'px, ' + top + 'px)' );

		} else {

			this.setCSSStyle( 'transform', element, 'translate(' + left + 'px, ' + top + 'px)' );

		}

	};

	/**
	 * Set vendor specific css
	 * @param {string} type - CSS style name
	 * @param {HTMLElement} element - The element to be modified
	 * @param {string} value - Style value
	 */
	PANOLENS.Infospot.prototype.setCSSStyle = function ( type, element, value ) {

		var style = element.style;

		if ( type === 'transform' ) {

			style.webkitTransform = style.msTransform = style.transform = value;

		}

	};

	/**
	 * Set hovering text content
	 * @param {string} text - Text to be displayed
	 */
	PANOLENS.Infospot.prototype.setText = function ( text ) {

		if ( this.element ) {

			this.element.textContent = text;

		}

	};

	/**
	 * Add hovering text element
	 * @param {string} text - Text to be displayed
	 */
	PANOLENS.Infospot.prototype.addHoverText = function ( text ) {

		if ( !this.element ) {

			this.element = document.createElement( 'div' );

			this.element.style.display = 'none';
			this.element.style.color = '#fff';
			this.element.style.top = 0;
			this.element.style.maxWidth = '50%';
			this.element.style.maxHeight = '50%';
			this.element.style.textShadow = '0 0 3px #000000';
			this.element.style.fontFamily = '"Trebuchet MS", Helvetica, sans-serif';
			this.element.style.position = 'fixed';
			this.element.classList.add( 'panolens-infospot' );

		}

		this.setText( text );

	};

	/**
	 * Add hovering element by cloning an element
	 * @param {HTMLDOMElement} el - Element to be cloned and displayed
	 */
	PANOLENS.Infospot.prototype.addHoverElement = function ( el ) {

		if ( !this.element ) { 

			this.element = el.cloneNode( true );
			this.element.style.display = 'none';
			this.element.style.top = 0;
			this.element.style.position = 'fixed';
			this.element.classList.add( 'panolens-infospot' );

		}

	};

	/**
	 * Remove hovering element
	 */
	PANOLENS.Infospot.prototype.removeHoverElement = function () {

		if ( this.element ) { 

			if ( this.element.left ) {

				this.container.removeChild( this.element.left );
				this.element.left = null;

			}

			if ( this.element.right ) {

				this.container.removeChild( this.element.right );
				this.element.right = null;

			}

			this.container.removeChild( this.element );
			this.element = null;

		}

	};

	/**
	 * Lock hovering element
	 */
	PANOLENS.Infospot.prototype.lockHoverElement = function () {

		if ( this.element ) { 

			this.element.locked = true;

		}

	};

	/**
	 * Unlock hovering element
	 */
	PANOLENS.Infospot.prototype.unlockHoverElement = function () {

		if ( this.element ) { 

			this.element.locked = false;

		}

	};

	/**
	 * Show infospot
	 * @param  {number} [delay=0] - Delay time to show
	 */
	PANOLENS.Infospot.prototype.show = function ( delay ) {

		delay = delay || 0;

		this.hideAnimation && this.hideAnimation.stop();
		this.showAnimation && this.showAnimation.delay( delay ).start();

	};

	/**
	 * Hide infospot
	 * @param  {number} [delay=0] - Delay time to hide
	 */
	PANOLENS.Infospot.prototype.hide = function ( delay ) {

		delay = delay || 0;

		this.showAnimation && this.showAnimation.stop();
		this.hideAnimation && this.hideAnimation.delay( delay ).start();
		
	};

	/**
	 * Dispose infospot
	 */
	PANOLENS.Infospot.prototype.dispose = function () {

		this.removeHoverElement();
		this.material.dispose();

		if ( this.parent ) {

			this.parent.remove( this );

		}

	};

} )()