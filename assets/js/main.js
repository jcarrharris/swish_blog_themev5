require(['modernizr'], function() {

	var config = {
			comments: {
				type: 'Disqus', // Set to either "Google+", "Disqus" or "Livefyre" to enable commenting
				token: 'swishlabs', // The shortname for Disqus or the site ID for Livefyre. Google+ is very smart and doesn't need anything
			},
			ga: {
				id: 'UA-45517638-1', // Place your Google Analytics ID between the quotes or leave empty to disable Google Analytics tracking
			},
			history: true, // Set to false if you want to disable HTML5 history + AJAX page loading
			skrollr: {
				enabled: true, // Set to false if you want to disable Skrollr completely
				mobile: false, // Set to true if you want to enabe Skrollr on mobile devices
			},
			tapir: {
				token: '', // Place your Tapir token between the quotes or leave empty to disable search
			},
		},
		$document = $(document),
		$window = $(window),
		$body = $(document.body),
		$sidebar = $('.site-sidebar'),
		$container = $('.site-container'),
		$header = $('.site-header'),
		$main = $('.site-main'),
		click = Modernizr.touch ? 'touchstart' : 'click';


	function loadCss(url) {

		var link = document.createElement('link');

		link.rel = 'stylesheet';
		link.href = url;

		document.getElementsByTagName('head')[0].appendChild(link);
	}

	function isExternal(url) {

		return location.host !== url.replace('http://', '').replace('https://', '').split('/')[0];
	}


	// Templates

	var templates = $.Deferred();

	$.ajax('/assets/templates.html')
	.done(function(data) {

		templates.resolve($('<div></div>').html(data).find('template'));
	});


	// Google Analytics

	if(config.ga.id && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {

		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

		ga('create', config.ga.id);
		ga('send', 'pageview');
	}


	// Search

	if(config.tapir.token) {

		require(['handlebars', 'moment', 'jquery.tapirus'], function() {

			templates.done(function(templates) {

				var $templates = $('<div></div>').html(templates);

				$sidebar.prepend($templates.find('#search').html());

				$('.site-search-results').Tapirus(config.tapir.token, {
					sessionStorage: Modernizr.sessionstorage,
					templates: {
						count: '',
						result: $templates.find('#search-result').html(),
					},
				});
			});
		});
	}


	// Sidebar

	var sidebar = {
			hidden: $sidebar.hasClass('hidden'),

			show: function() {

				$body
				.addClass('site-sidebar-visible')
				.removeClass('site-sidebar-hidden');

				$sidebar
				.css('top', $window.scrollTop())
				.attr('aria-hidden', sidebar.hidden = false)
				.removeClass('hidden');

				if(Modernizr.csstransitions) $container.on('webkitTransitionEnd transitionend', done);
				else done();

				function done() {

					$body.addClass('overflow-hidden');
				}
			},

			hide: function() {

				$body
				.addClass('site-sidebar-hidden')
				.removeClass('site-sidebar-visible');

				$sidebar
				.attr('aria-hidden', sidebar.hidden = true)
				.addClass('hidden');

				if(Modernizr.csstransitions) $container.on('webkitTransitionEnd transitionend', done);
				else done();

				function done() {

					$body.removeClass('overflow-hidden');
				}
			},

			toggle: function() {

				sidebar[sidebar.hidden ? 'show' : 'hide']();
			},
		};

	$body
	.on(click, '.site-sidebar-toggle', function(event) {

		event.preventDefault();

		sidebar.toggle();
	})
	.on(click, '.site-sidebar-overlay', function(event) {

		sidebar.hide();
	});

	$document.on('keydown', function(event) {

		if(event.keyCode === 27) sidebar.hide();
	});


	// Loadbar

	var Loadbar = function() {

			var $element = $('<div class="loadbar"></div>').appendTo(document.body);

			return {
				destroy: function() {

					$element.remove();
				},

				progress: function(progress) {

					$element.removeClass('hide');

					var transitionDuration = parseFloat($element.css('transition-duration'));

					$element.width(Math.floor(progress * $body.width()));

					if(progress === 1)
					setTimeout(function() {

						$element.addClass('hide');

						setTimeout(function() {

							$element.width(0);
						},
						transitionDuration * 1000);
					},
					transitionDuration * 1000);
				},
			}
		};

	var loadbar = Loadbar();


	// History

	if(Modernizr.history && config.history) {

		var pushedState = false; // Handle page load popstate event

		$body
		.on('click', '.post-excerpt', function(event) {

			event.preventDefault();

			pushedState = true;
			history.pushState(null, document.title, $(this).find('.post-title a').attr('href'));

			load();
		})
		.on('click', '.pagination a', function(event) {

			event.preventDefault();

			pushedState = true;
			history.pushState(null, document.title, $(this).attr('href'));

			load($(this).parent().hasClass('older') ? 'next' : 'prev');
		})
		.on('click', '.site-nav a, .site-search-results a', function(event) {

			if(isExternal(this.href)) return;

			event.preventDefault();

			pushedState = true;
			history.pushState(null, document.title, $(this).attr('href'));

			load()
			.done(function() {

				setTimeout(function() {

					sidebar.hide();
				},
				200);
			});
		});

		window.addEventListener('popstate', function(event) {

			if(pushedState) load();
		});

		function load(pagination) {

			var url = location.href,
				deferred = $.Deferred();

			if(config.ga.id && typeof ga === 'function') ga('send', 'pageview', {'page': location.pathname, 'title': document.title});

			loadbar.progress(0.5);

			switch(pagination) {

				case 'next':

					$.ajax(url)
					.done(function(data) {

						var $dummy = $('<div></div>').html(data),
							$newContainer = $dummy.find('.site-container');

						$body.append($newContainer)

						$body
						.animate({scrollTop: $newContainer.offset().top}, 500)
						.promise()
						.done(function() {

							$container.remove();

							$container = $newContainer;

							$window.scrollTop(0); // Reset scroll position after removing main

							init();

							deferred.resolve();

							loadbar.progress(1);
						});

						beforeInit();
					});

					break;

				case 'prev':

					$.ajax(url)
					.done(function(data) {

						var $dummy = $('<div></div>').html(data),
							$newContainer = $dummy.find('.site-container');

						$sidebar.after($newContainer);

						$body
						.scrollTop($container.offset().top)
						.animate({scrollTop: 0}, 1000)
						.promise()
						.done(function() {

							$container.remove();

							$container = $newContainer;

							init();

							deferred.resolve();

							loadbar.progress(1);
						});

						beforeInit();
					});

					break;

				default:

					$.ajax(url)
					.done(function(data) {

						var $dummy = $('<div></div>').html(data),
							$newContainer = $dummy.find('.site-container');

						$dummy.find('title')[0];

						document.title = $dummy.find('title').html();

						$container.remove();

						$container = $newContainer;

						$body.append($newContainer);

						$window.scrollTop(0);

						init();

						deferred.resolve();

						loadbar.progress(1);
					});
			}

			return deferred;
		}
	}
	else {

		$body.on('click', '.post-excerpt a', function(event) {

			event.preventDefault();

			location.href = this.href;
		});
	}


	// Skrollr

	if(config.skrollr.enabled === true && (config.skrollr.mobile === true || !(/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i).test(navigator.userAgent || navigator.vendor || window.opera))) {

		require(['skrollr'], function() {

			window.Skrollr = skrollr.init({
				forceHeight: false, 
			});
		});
	}


	// Init

	function beforeInit() {

		// Skrollr

		if(window.Skrollr) Skrollr.refresh();
	}

	function init() {

		$container.append('<div class="site-sidebar-overlay"></div>');


		// Skrollr

		if(window.Skrollr) Skrollr.refresh();


		// Prism

		if($('pre code').length) {

			loadCss('/assets/css/prism.css');

			require(['prism'], function() {

				Prism.highlightAll();
			});
		}


		// Comments

		if(config.comments.type && !$body.hasClass('page')) {

			templates.done(function($templates) {

				$('.post-full .wrapper').append($templates.filter('#comments').html());

				$('.comments-toggle').on('click', function(event) {

					event.preventDefault();

					var element = this;

					$(this).hide();

					require(['comments'], function(Comments) {

						Comments(element, config.comments.type, config.comments.token);
					});
				});
			});
		}


		// Featured image

		var $post = $('.post'),
			$featuredImage = $post.find('.post-header + p img:first-child');

		if($featuredImage.length) {

			$post.prepend('<div class="featured-image" style="background-image: url(' + $featuredImage.attr('src') + ')""></div>');

			$featuredImage.parent().remove();
		}
	}

	init();
});