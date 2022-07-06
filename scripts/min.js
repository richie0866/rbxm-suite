const luamin = require("luamin");
const path = require("path");
const fs = require("fs");

const minified = luamin.minify(fs.readFileSync(path.join(__dirname, "../src/rbxm-suite.lua"), "utf8"));

const code = `local rbxmSuite = (function()
	${minified}
end)()

return rbxmSuite
`;

fs.writeFileSync("rbxm-suite.lua", code);
