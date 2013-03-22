Style Guide
===========

Code style is as [Felix's Node.js Style Guide][1], with the
amendments and additions below:

[1]: http://nodeguide.com/style.html


## JSHint

Options used:

```
node:     true    Code is running inside of the Node runtime environment
curly:    true    Always put curly braces around blocks in loops and conditionals
eqeqeq:   true    Prohibits the use of == and != in favor of === and !==
immed:    true    Prohibits the use of immediate function invocations without parens
indent:   2       Two spaces for indentation
latedef:  true    Prohibits the use of a variable before it was defined
noarg:    true    Prohibits the use of arguments.caller and arguments.callee
noempty:  true    Warns when you have an empty block in your code
nonew:    true    Prohibits the use of constructor functions for side-effects
plusplus: true    Prohibits the use of unary increment and decrement operators
quotmark: single  Enforces the consistency of quotation marks
undef:    true    Prohibits the use of explicitly undeclared variables
unused:   true    Warns when you define and never use your variables
trailing: true    Makes it an error to leave a trailing whitespace in your code
maxlen:   80      Line length
```

`/*global escape*/` is also needed in `twitter.js` as `node: true`
doesn't whitelist it.

### Variable names

The following options can be used to further enforce naming convention. The
existing code doesn't pass these yet.

```
camelcase: true   Force all variable names to use either camelCase style or UPPER_CASE
newcap:    true   Requires you to capitalize names of constructor functions
nomen:     true   Disallows the use of dangling _ in variables
```


## If-else braces

_Right_:

``` javascript
if (true) {
  claim('Logic works!');
} else if (NaN === NaN) {
  despair();
} else {
  ohno('!');
}
```

_Wrong_:

``` javascript
if (false) {
  shout('Down with you!');
}
else if ("" == 0) {
  hack();
}
else {
  calmly('disengage');
}
```

Try..Catch statements follow the same style.


## Single-line conditionals

…are not allowed.

_Right_:

``` javascript
if (true) {
  something();
}
```

_Wrong_:

``` javascript
if (true) something();

if (true)
  something();

// Very wrong:
if (true)
something();
```


## Spacing around conditionals

_Right_:

``` javascript
if (iAmRight) {
  execute(this);
  execute(that);
}
```

_Wrong_:

``` javascript
if (iAmWrong) {

  fooo();
}

if (toBe) {
  baar();

}

if (notToBe) {

  baaz();

}
```


## Closure style

_Right_:

``` javascript
function(arg) {
  // ...
}
```

_Wrong_:

``` javascript
function (arg) {
  // ...
}
```


## Functions with many arguments

``` javascript
oauth = new oauth.OAuth(
  options.request_token_url,
  options.access_token_url,
  options.consumer_key,
  options.consumer_secret,
  '1.0',        // version
  null,         // authorize callback?
  'HMAC-SHA1',  // signature method
  null,         // nonce size
  this.options.headers
);

oauth.get(
  url,
  // ...
  content_type,
function(error, data, response) {
  handle();
});
```

- Closing _paren_ on newline, to demark a “block”
- All arguments on their own line
- Short comments to give precisions if necessary
- Callbacks start unindented, to group closing _paren_ and
  _bracket_; it also provides enough of a break to separate
  the “blocks”

### For smaller ones…

This is acceptable, especially to split long concatenation. Notice:

- The `+` is _before_ the split, just like a `,` would
- The second line is aligned with the quote, i.e. just _after_ the last
  opening brace
- This is short enough not to need the closing _parens_ aligned with
  the opening ones, as opposed to the example above

``` javascript
callback(new Error('HTTP Error ' + response.statusCode + ': ' +
                   http.STATUS_CODES[response.statusCode]));
```


## EOF

All files should have a newline at the end (to make diffing cleaner).
