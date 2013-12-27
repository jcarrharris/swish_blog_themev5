define(function() {

	return function(script, type, token) {

		var container = document.createElement('div');

		container.className = 'comments';

		script.parentNode.insertBefore(container, script);

		switch(type) {

			case 'Disqus':

				var element = document.createElement('div');

				element.id = 'disqus_thread';

				container.appendChild(element);

				require(['//' + token + '.disqus.com/embed.js']);

				break;

			case 'Google+':

				var element = document.createElement('div');

				element.className = 'g-comments';
				element.setAttribute('data-href', location.href);
				element.setAttribute('data-first_party_property', 'BLOGGER');
				element.setAttribute('data-view_type', 'FILTERED_POSTMOD');

				container.appendChild(element);

				require(['//apis.google.com/js/plusone.js?callback=gpcb']);

				break;

			case 'Livefyre':

				var element = document.createElement('div');

				element.id = 'livefyre-comments';

				container.appendChild(element);

				require(['http://zor.livefyre.com/wjs/v3.0/javascripts/livefyre.js'], function() {

					(function () {
						var articleId = fyre.conv.load.makeArticleId(null);
						fyre.conv.load({}, [{
							el: 'livefyre-comments',
							network: 'livefyre.com',
							siteId: token,
							articleId: articleId,
							signed: false,
							collectionMeta: {
								articleId: articleId,
								url: fyre.conv.load.makeCollectionUrl(),
							}
						}], function() {});
					}());
				});

				break;
		}
	}
});