local modules = {}
local oldRequire = require
local runtime

local function copy(array)
	local newTbl = table.create(#array)
	for i, v in ipairs(array) do
		newTbl[i] = v
	end
	return newTbl
end

local function pathArrayToString(pathArray)
	return table.concat(pathArray, "\0")
end

--
-- TODO: Refactor!!! This is a very ugly implementation that could be improved in the future.
--

local Pointer
do
	Pointer = {}
	Pointer._cache = {}

	local baseScript = Instance.new("ModuleScript")

	function Pointer.new(pathArray)
		local id = pathArrayToString(pathArray)

		local cached = Pointer._cache[id]
		if cached then
			return cached
		end
		
		local self = setmetatable(pathArray, Pointer)
		Pointer._cache[id] = self
		return self
	end

	function Pointer.is(script)
		return type(script) == "table" and getmetatable(script) == Pointer
	end
	
	-- Workaround for RuntimeLib 'TS.getModule'
	function Pointer:FindFirstAncestorWhichIsA()
		return nil
	end
	
	-- Workaround for RuntimeLib 'TS.getModule'
	function Pointer:FindFirstChild(k)
		if k == "node_modules" and string.match(table.concat(self, "."), "%.include") == nil then
			return nil
		elseif k == "@rbxts" and string.match(table.concat(self, "."), "%.include") ~= nil then
			return nil
		end
		return self[k]
	end
	
	-- Workaround for RuntimeLib 'TS.getModule'
	function Pointer:IsDescendantOf()
		return false
	end
	
	-- Workaround for RuntimeLib 'TS.import' module loading
	function Pointer:WaitForChild(k)
		return self[k]
	end
	
	function Pointer:__index(k)
		assert(type(k) == "string", "Cannot index pointer with non-string value")
		if Pointer[k] then
			return Pointer[k]
		elseif k == "Parent" then
			if #self == 1 then
				return nil
			else
				self = copy(self)
				table.remove(self)
			end
		elseif k == "Name" then
			return table.concat(self, ".")
		elseif pcall(function() return baseScript[k] end) then
			local val = baseScript[k]
			if type(val) == "function" then
				return function(_, ...) val(baseScript, ...) end
			end
			return val
		else
			self = copy(self)
			table.insert(self, k)
		end
		return Pointer.new(self)
	end
end

local require, requireModule
do
	function requireModule(pointer)
		local module = modules[pathArrayToString(pointer)]
		if module.called then
			assert(module.func == nil, "Cyclic dependency detected on script " .. table.concat(pointer, "."))
		else
			module.called = true
			module.result = module.func()
			module.func = nil
		end
		return module.result
	end

	function require(obj)
		if Pointer.is(obj) then
			return requireModule(obj)
		else
			return oldRequire(obj)
		end
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
