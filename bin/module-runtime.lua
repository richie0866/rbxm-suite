local runtime

local function pathArrayToString(pathArray)
	return table.concat(pathArray, "\0")
end

local Script
do
	Script = {}

	local baseScript = Instance.new("ModuleScript")

	function Script.new(pathArray)
		return setmetatable(pathArray, Script)
	end

	function Script.is(script)
		return type(script) == "table" and getmetatable(script) == Script
	end

	-- Workaround for RuntimeLib 'TS.getModule'
	function Script:FindFirstChild(k)
		return self[k]
	end

	function Script:__index(k)
		if Script[k] then
			return Script[k]
		elseif k == "Parent" then
			table.remove(self)
		elseif pcall(function() return baseScript[k] end ) then
			return baseScript[k]
		else
			table.insert(self, k)
		end
		return self
	end
end

local modules = {}

local function requireModule(script)
	local module = modules[pathArrayToString(script)]
	if module.called then
		assert(module.func == nil, "Cyclic dependency detected on script " .. table.concat(script, "."))
	else
		module.called = true
		module.result = module.func()
		module.func = nil
	end
	return module.result
end

local function _safeRequireModule(obj)
	if Script.is(obj) then
		return requireModule(obj)
	else
		return require(obj)
	end
end

local function createModule(pathArray, func)
	local module = {
		called = false,
		result = nil,
		func = func,
	}
	modules[pathArrayToString(pathArray)] = module
	return module
end

--
runtime = { --[[@MODULES]] }
--

for pathArray, func in pairs(runtime) do
	createModule(pathArray, func)
end

for pathArray in pairs(runtime) do
	if pathArray[#pathArray] == "--[[@MODEL_NAME]]" then
		return requireModule(pathArray)
	end
end

warn("--[[@MODEL_NAME]] could not be found")
