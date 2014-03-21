# Livefyre Auth

    var auth = Livefyre.require('auth');

## Principles

* Host pages implement and call methods on only one object that they create and register
  with the `auth` module. The only auth method an integrator should ever call is `setToken`
* App developers only call methods on the auth module and its properties. They
  never have to worry about the delegate directly

## Auth Delegates

Host sites create an auth delegate, and only call methods on their auth
delegate, not the auth module.

When a user logs in, they are responsible for calling `delegate.setToken('token');`

    Customer.LivefyreAuth = auth.delegate(new auth.RemoteAuth({
        login: function () {
            CustomerAuth.authenticate(function () {
                this.setToken('myToken');
            }.bind(this));
        },
        logout: function () {
            CustomerAuth.clearAuth();
            this.setToken(null);
        }
    }));

### Scenario: A user logs out via customer link, apps need to find out

Customer does this

    $('#customer-log-out-button', function () {
        Customer.LivefyreAuth.setToken(null); 
    });

Apps are finding out via

    auth.on('logout', function (previousUser) {
        // stuff    
    });

## AppKit Auth

App Developers have needs too. They use the `auth` module singleton.
They never touch the delegate, nor can they.

The semantics of the invocation of these methods are like requests.
"I request that the user be logged in". However, those requests may not be
fulfilled by the delegate.

### Is the user currently logged in?

    auth.user.isAuthenticated();

### The user needs to login

Apps can present a 'log in' link, or they may have buttons that require auth
to perform their command.

`auth.login` will use the customer-provided authDelegate.

And I don't care what happens

    auth.login();

And I want to know who they authenticate as

    auth.login(function (user) {});

And I care about their permissions/keys in a given scope. This would pass
appropriate options to the auth endpoint for that collection

    auth.login(scopeObj, function (user) {});
    auth.login(collectionOpts, function (user, scopeAuth) {});
    auth.login({ siteId: 123456 }, function (user, scopeAuth) {});

This can be called even if the user is already logged in. For example, if you only find out
after a bit that you need permissions for a new scope.

### The user would like to log out

    auth.logout();

### Notify me when a user logs in

    auth.on('login', function (user) {
        thisComponent.setUser(user);
    });

### Notify me when a user logs out

    auth.on('logout', function (user) {
        thisComponent.setUser(user);
    });

### Call a function if a user is logged in or whenever they do

    auth.on('change:user', function (userOrFalsy) {
        if (user) {
            myComponent.setUser(user);
        } else {
            myComponent.renderLoggedOut();
        }
    })

Or maybe the user object is always passed, and the check is `isAuthenticated()`.
I want this but not sure how to design it.

Or maybe

    auth.eachUser(function (userOrFalsy) { });

# Questions

* Is `auth.user` guaranteed to always be the same object, or no? Shouldn't it
  change when a new user logs in or out? Is it ever falsy?
* What is the point of Liveyfre.user.loadSession? and who should call it when?
  Why isn't it auth.loadSession()?
* What if I call `auth.login()` when the user is already set? Should it just pass
  the currently logged in user to my callback? (ben: yes!)
* Should apps be able to access `setToken`? So a log in button could be an app? No for now.
  But it could call `auth._delegate.setToken`

