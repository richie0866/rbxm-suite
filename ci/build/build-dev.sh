#!/usr/bin/env bash

RBXM_INPUT='rbxmSuite.rbxm'

LUA_OUTPUT='rbxmSuite.lua'

main() {
	rojo build -o $RBXM_INPUT
	remodel run ci/build/build-to-script.lua $RBXM_INPUT
	echo "$(minify $LUA_OUTPUT)" >|$LUA_OUTPUT
}

wrap_in_function_call() {
	src=$(cat)
	test=$(cat ci/tests/test.lua)
	echo $'local rbxmSuite = (function()\n\n'"	${src//$'\n'/$'\n'	}"$'\n\nend)()\n\n'"$test"
}

minify() {
	echo "$(<$1)" | wrap_in_function_call
}

main "$@"
