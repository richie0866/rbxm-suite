#!/usr/bin/env bash

LUA_INPUT='src/rbxm-suite.lua'
LUA_OUTPUT='rbxm-suite.lua'

main() {
	cp $LUA_INPUT $LUA_OUTPUT
	echo "$(minify $LUA_OUTPUT)" >|$LUA_OUTPUT
}

wrap_in_function_call() {
	echo $'local rbxmSuite = (function()\n\n'"	$(cat)"$'\n\nend)()\n\nreturn rbxmSuite'
}

minify() {
	echo "$(<$1)" | npx luamin -c | wrap_in_function_call
}

main "$@"
