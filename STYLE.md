Style Guide
===========

Code style is as [Felix's Node.js Style Guide][1], with the
amendments and additions below:

[1]: http://nodeguide.com/style.html


## JSHint

Options used:

```
node:     true
curly:    true
eqeqeq:   true
immed:    true
indent:   2
latedef:  true
noarg:    true
noempty:  true
nonew:    true
plusplus: true
quotmark: single
undef:    true
unused:   true
trailing: true
maxlen:   80
```

`/*global escape*/` is also needed in `twitter.js` as `node: true`
doesn't whitelist it.

### Variable names

The following options can be used to further enforce naming convention. The
existing code doesn't pass these yet.

```
camelcase: true
newcap:    true
nomen:     true
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
