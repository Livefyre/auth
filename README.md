# auth

Web Components frequently need to know about and/or trigger authentication by
the end-user, but should not need to be tightly-coupled to any one authentication strategy.

With `auth`
* **Site Operators** `auth.delegate(obj)` the details of how they want components to trigger login, logout, and viewProfile
* **Component Developers** write components against a common set of methods, e.g. `auth.login(errback)`
* `auth` **plugins** can watch for events on `auth`. For example, [`auth-livefyre`](//github.com/gobengo/auth-livefyre) watches for `authenticate.livefyre` events, authenticates the user with the included credentials, and then calls `auth.login({ livefyre: livefyreUser })`

## For Site Operators

Web Site operators make the decisions about what sort of authentication strategies they prefer. They should be able to delegate the details to an Auth object to coordinate the effort.

This module exports a singleton instance of `auth/auth` Usually there
will only be one Auth object running on a webpage.

On load, a Site Operator should use the `.delegate` method to configure this Auth object by passing an 'authentication delegate' like the following:

    auth.delegate({
        // Called when a component would like to authenticate the end-user
        // You may want to redirect to a login page, or open a popup
        // Call `authenticate` when login is complete, passing an Error object
        // if there was an error, and authentication credentials if they have
        // been procured
        login: function (authenticate) {
            authenticate(null, {
                providerName: 'token'
            });
        },

        // Called when a component would like to deauthenticate the end-user
        // You may want to clear a cookie
        // Call `finishLogout` when logout is complete, passing an Error object
        // if there was an error
        logout: function (finishLogout) {
            finishLogout();
        },

        // Called when a component would like to view the user's profile page
        viewProfile: function () {},

        // Called when a component would like to edit the user's profile
        editProfile: function () {}
    });

On page load, the user may already have authentication credentials without needing to login again. In this case, a Site Operator should call

    auth.authenticate({
        providerName: 'token'
    });

## For Component Developers

A Web Component developer may wish to be notified when end-user authentication
status changes. For example, certain actions may only be enabled if the user
is authenticated. Or if the user is not authenticated, the component may wish
to render a 'Log in' link.

For these purposes, component developers can listen for events emitted by an
Auth object

    auth.on('login', setUserLoggedIn.bind(this, true));
    auth.on('logout', setUserLoggedIn.bind(this, false))

Components may also need to trigger auth actions. This can be done by invoking methods on `auth`:

    // Log the user out
    // This will invoke authDelegate.logout
    // Your callback will be called after logout
    auth.logout(function (err) {
        // err will be truthy if the user did not fully logout
    });

    // Start a login flow
    // This will invoke authDelegate.login
    // Your callback will be called when this is all done
    auth.login(function (err, credentials) {
        // err will be truthy if the user failed to login
        // credentials are the credentials gotten from this .login invocation
    });

If `auth.login` is passed an argument other than a function, it will trigger login as the provided user/info. Identity provider modules will use this to trigger 'login' events.

    auth.login({
        providerName: { userId: 6 }
    });

## For Relying Modules

One may wish to make modules that can monitor `auth` activity on the page. `auth` throws several events that are useful for this.

### Events

#### login

A user has logged in. Usually this is emitted after something passes a non-function to `auth.login()`. Handlers will be passed an object indicating the providers that were logged in.

    auth.on('login', function (providers) {
        assert.equal(providers.providerName.userId, 6)
    });

##### login.{providerName}

Some modules may only care about certain `providerNames` that are passed as keys to  `auth.login()`. You can listen to logins only for a particular providerName.

    auth.on('login.providerName', function (user) {
        assert.equal(user.userId, 6);
    });

#### logout

A user has logged out. Usually this is emitted after something invokes `auth.logout()`. Relying modules SHOULD clear their auth state until future login events.

    auth.on('logout', function (providers) {
        assert.equal(providers.providerName.userId, 6)
    });

#### authenticate

Someone has provided authentication credentials for the session. Some relying modules will know how to authenticate certain credentials, and then call .login() or take other actions.

    auth.on('authenticate', function (providerCredentials) {
        assert('providerName' in providerCredentials);
        // the following is the value
        // passed to authenticate({ providerName: value })
        providerCredentials.providerName; 
        auth.login({ providerName: user });
    });

##### authenticate.{providerName}

Some modules may only care about certain `providerNames` that are passed as keys to `auth.authenticate()`. You can listen to authenticates only for a particular providerName.

    auth.on('authenticate.providerName', function (token) {
        assert.equal(token, 'kajsdfkasdjfajdsf');
    });
