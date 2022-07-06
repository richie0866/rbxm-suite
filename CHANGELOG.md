# v2.2.2

## Bug Fixes

- Fixed a bug in the `nocache` option. 26bcb292bd452bee98f5dd077a0f45a741b5aeaa 72c36e80e5d2e47d3b75cef01f2215fef4cba8b1 @richie0866
- Fixed recursion issue in custom `require` implementation. 72c36e80e5d2e47d3b75cef01f2215fef4cba8b1 @richie0866
- Top-level LocalScripts are now executed when `runscripts` is true. 26bcb292bd452bee98f5dd077a0f45a741b5aeaa @richie0866

# v2.2.1

## Development

- Fix globals for debug mode 14fcbdf8ee5bb390526436163a01b58f39432785 @richie0866

# v2.2.0

## New Features

📂 Add `nocache` option for Roblox library assets

  - Add support for nocache option 00f18b12fe3990d457563fe85b0260ec79e48c73 @EpixScripts

🧬 Add `deferred` option for running scripts when `runscripts` is true

## Development

🔥 Allow Luau optimizations that were disabled in previous versions

  - Remove 'setfenv' by localizing globals, refactor code deed3cdbb55bb5c9871254d896c720b23040f485 @richie0866
  - Use new selene executor environment @EpixScripts

# v2.1.1

## Development

  - Minify in JS instead of bash 4040354c79260ed04e91c49f32bcc1144b679446 @richie0866
  - Use latest asset redirect internally 7fce52ba2f57de5134ab096b19d9f032d41ee7ef @richie0866

# v2.1.0

## New Features

⭐ Add support for `rbxassetid` content ids 540e1c43479f3773fd9fca0e70ce5165845ed94e @8y8x

# v2.0.3

## Bug Fixes

  - Use HttpGetAsync instead of request 5152dc0bacc3705f40dadf06a73fcf97586b3687 @richie0866
  - Fix issue with running init 5152dc0bacc3705f40dadf06a73fcf97586b3687 @richie0866

# v2.0.2

## Bug Fixes

⭐ Fix false module recursion error when using Roblox-TS

  - Do not check loaded modules for recursion 2f1fd6f43e52b2437c6e487d53e578fa415f9e2b @richie0866

## Documentation

  - Fix mistakes in docs (#5)

# v2.0.1

## Development

  - Minor refactor 4a4f0fe14c6ebd4a7b5626b940149acfcf07b8a5 @richie0866

# v2.0.0

## Documentation

⭐ Use EmmyLua annotations

  - Avoid Luau type-related errors in exploits and the lua minifier

## Development

⭐ Full Luau rewrite to improve performance and reduce file size

  - Rewrite in Luau 9bc10fe177c91cb5c9dba954aac4f6bb69875de4 @richie0866
  - Add `no_circular_deps` option 2042c0ca962b0301c12c2696e3281c3dcbe93ba6 @richie0866

# v1.0.3

## Bug Fixes

	- Fix bug with cyclic dependencies bafb39b1df28e9b7c55b9eb0695e255b1e9c93ec @richie0866

# v1.0.2

## New Features

⭐ Add `unsafe` parameter to disable cyclic dependency errors

  - Add `unsafe` parameter 58ba4b1f3818586d451e941d5af4a634cf4e665d @richie0866

## Development

  - Make `Store.onChange` public cda748f19b28b731213dff60030fc1bccc49ab34 @richie0866
  - Rephrase README to be more readable @richie0866

# v1.0.1

## New Features

⭐ Lazily run scripts to improve build time

  - Lazy-load executors (#2) 760da7743a0accf023dd137d6a3087b60a93f8fd @richie0866

## Bug Fixes

⭐ Fix `fs.normalize` replacing back-slashes incorrectly

  - Fix normalize substitution b298b1b20c10362745a2a28fa694a647018d7d79 @richie0866 

## Documentation

  - Write up README.md bf50c6f9694908801f5614bfa077a13e137b16b0 2dd1ab499bf6c79b043d5aa51898dd86f1aa547e @richie0866 
