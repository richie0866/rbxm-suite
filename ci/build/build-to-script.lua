local modelFile = ...
local root = remodel.readModelFile(modelFile)[1]

local modelFileName = string.match(modelFile, "([^/\\]+)%.rbxmx?$")
assert(modelFileName, "Could not get name for model file")

local function getTree(instance)
	local tree = {}
	local obj = instance
	while obj do
		table.insert(tree, 1, obj.Name)
		obj = obj.Parent
	end
	return tree
end

local MODULE_FORMAT = table.concat({
	"[Pointer.new(%s)] = function()",
	"\tlocal script = Pointer.new(%s)",
	"",
	"\t%s",
	"end",
}, "\n")

local function moduleNode(instance)
	local pathArray = "{ [[" .. table.concat(getTree(instance), "]], [[") .. "]] }"
	return string.format(
		MODULE_FORMAT,
		pathArray,
		pathArray,
		string.gsub(remodel.getRawProperty(instance, "Source"), "\n", "\n\t")
	)
end

local function modulesToNodes(instance)
	local nodes = {
		instance.ClassName == "ModuleScript" and moduleNode(instance) or nil
	}
	for _, child in ipairs(instance:GetChildren()) do
		for _, childNext in ipairs(modulesToNodes(child)) do
			table.insert(nodes, childNext)
		end
	end
	return nodes
end

-- Transform the module into a list of functions
local nodes = modulesToNodes(root)

-- Get the module runtime script
local runtime = remodel.readFile("ci/build/runtime.lua")

-- Replace the --[[@MODEL_NAME]] marker with the rbxm file's name
runtime = string.gsub(runtime, "%-%-%[%[@MODEL_NAME%]%]", modelFileName)

-- Replace the --[[@MODULES]] marker with a list of functions
local i, j = string.find(runtime, "%-%-%[%[@MODULES%]%]")
local output = table.concat({
	string.sub(runtime, 1, i - 1),
	"\t" .. string.gsub(table.concat(nodes, ",\n"), "\n", "\n\t"),
	string.sub(runtime, j + 1),
}, "\n")

-- Output folder
remodel.writeFile(modelFileName .. ".lua", output)

print(modelFileName .. ".lua")
