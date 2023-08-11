import Alpine from 'alpinejs'
import intersect from '@alpinejs/intersect'
import persist from '@alpinejs/persist'

var debug = 0 ? console.log.bind(console, '[alpine-test]') : function() {};

// Set up and start Alpine.
(function() {
    // Register AlpineJS plugins.
    Alpine.plugin(intersect);
    Alpine.plugin(persist);

    // Start Alpine.
    Alpine.start();
	
})();
