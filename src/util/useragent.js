/**
 * @filoverview Detect useragents. This should be used sparingly - in fact, most applications
 * that use authentication delegates should handle this themselves.
 */

var userAgent = navigator.userAgent.toLowerCase();
var isMobile = /(iphone|ipod|blackberry|android|palm|windows\s+ce)/.test(userAgent);
var isDesktop = /(windows|linux|os\s+[x9]|solaris|bsd)/.test(userAgent);
var isBot = /(spider|crawl|slurp|bot)/.test(userAgent);

module.exports = {
	isMobile: isMobile || !isBot || !isDesktop  // assume mobile if not bot or desktop
};
