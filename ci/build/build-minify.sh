#!/usr/bin/env bash

RBXM_INPUT='rbxmSuite.rbxm'
LUA_OUTPUT='rbxmSuite.lua'

main() {
	rojo build -o $RBXM_INPUT
	remodel run ci/build/build-to-script.lua $RBXM_INPUT
	echo "$(minify $LUA_OUTPUT)" >|$LUA_OUTPUT
}

revert_compound_assignments() {
	echo "$(cat)" | sed -E 's/(([A-z0-9_]+\.)*[A-z_][A-z0-9_]*)\s*(\.\.|\+|\-|\*|\/|\%|\^)\=/\1 = \1 \3/g'
}

fix_promise_vararg_call() {
	echo "$(cat)" | sed -E 's/(\.\.\.)(:)/(\1)\2/g'
}

wrap_in_function_call() {
	echo $'local rbxmSuite = (function()\n\n'"	$(cat)"$'\n\nend)()\n\nreturn rbxmSuite'
}

minify() {
	echo "$(<$1)" | revert_compound_assignments | npx luamin -c | fix_promise_vararg_call | wrap_in_function_call
}

main "$@"
