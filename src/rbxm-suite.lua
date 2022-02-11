---**rbxm-suite** is a tool designed for exploiting with a Rojo-based workflow.
---Loads a given model into the game and runs every script.
local rbxmSuite = {}

---@class Options
---@field debug          boolean Enable debug mode, default is false
---@field runscripts     boolean Run all enabled LocalScripts, default is true
---@field verbose        boolean Enable verbose mode, default is false
---@field nocirculardeps boolean Enable circular dependency prevention, default is true

---@class Context
---@field options      Options | nil
---@field currentId    number
---@field idToInstance table<number, Instance>
---@field instanceToId table<Instance, number>
---@field moduleToData table<string, table>
---@field modules      table<number, function>

---The name of the script displayed in logs and error traceback.
local PROGRAM_NAME = "rbxm-suite"
---The name of the cache folder used to store GitHub assets.
local CACHE_FOLDER_NAME = "_rbxm-suite-v2"
---The key used to store the execution context globally.
local CONTEXT_KEY = "__rbxm_suite_context"

---@type fun(path: string): string
local fileAsContent = getsynasset or getcustomasset or error("File -> Content API not found")

---@type fun(requestOptions: table): table
local requestAsync = syn and syn.request or request or error("HTTP request API not found")

---Shares information between sessions.
---@type Context
local context = getgenv()[CONTEXT_KEY]
if not getgenv()[CONTEXT_KEY] then
	context = {
		options = nil,
		currentId = 0,
		idToInstance = {},
		instanceToId = {},
		moduleToData = {},
		modules = {},
	}
	getgenv()[CONTEXT_KEY] = context
end

---Logs a message with rconsole. Only works in verbose mode.
---@vararg string
local function log(...)
	if context.options.verbose then
		print(...)
	end
end

---Library for downloading and version checking GitHub Releases.
local github = {}
do
	local HttpService = game:GetService("HttpService")

	---Creates a new release cache.
	function github.init()
		makefolder(CACHE_FOLDER_NAME)
		makefolder(CACHE_FOLDER_NAME .. "\\models")
		writefile(CACHE_FOLDER_NAME .. "\\latest.json", "{}")
	end

	---Deletes and recreates the release cache.
	function github.repair()
		delfolder(CACHE_FOLDER_NAME)
		github.init()
	end

	---Updates the latest.json file with the given updater function.
	---@param updater function
	function github.updateVersions(updater)
		local latest = readfile(CACHE_FOLDER_NAME .. "\\latest.json")
		local data = HttpService:JSONDecode(latest)
		updater(data)
		writefile(CACHE_FOLDER_NAME .. "\\latest.json", HttpService:JSONEncode(data))
	end

	---Returns the installed version of the given id.
	---@param id string
	---@return string?
	function github.version(id)
		local latest = readfile(CACHE_FOLDER_NAME .. "\\latest.json")
		return HttpService:JSONDecode(latest)[id]
	end

	---Returns an id for the given user, repo, and tag.
	---@param user string
	---@param repo string
	---@param tag string
	---@param asset string
	---@return string
	function github.id(user, repo, tag, asset)
		return user .. "-" .. repo .. "-" .. tag .. "-" .. asset
	end

	---Returns the path to the given id.
	---@param id string
	---@return string
	function github.path(id)
		return CACHE_FOLDER_NAME .. "\\models\\" .. id
	end

	---Returns the URL to download the asset.
	---@param user string
	---@param repo string
	---@param tag string
	---@param asset string
	---@return string
	function github.url(user, repo, tag, asset)
		return "https://github.com/" .. user .. "/" .. repo .. "/releases/download/" .. tag .. "/" .. asset
	end

	---Returns the lastest version of the GitHub repository.
	---@param user string
	---@param repo string
	---@return string
	function github.latestTag(user, repo)
		local url = "https://api.github.com/repos/" .. user .. "/" .. repo .. "/releases/latest"
		local response = requestAsync({
			Url = url,
			Method = "GET",
		})
		assert(response.Success, "Version check failed: " .. response.StatusCode .. " " .. response.StatusMessage)
		local data = HttpService:JSONDecode(response.Body)
		return data.tag_name
	end

	---Updates the cache with the latest version of the given GitHub Release.
	---Calls `onComplete` when finished.
	---@param user string
	---@param repo string
	---@param asset string
	---@return string
	function github.downloadLatest(user, repo, asset)
		local latestTag = github.latestTag(user, repo)
		local id = github.id(user, repo, "latest", asset)
		local url = github.url(user, repo, latestTag, asset)
		local path = github.path(id)

		if isfile(path) and github.version(id) == latestTag then
			return path
		end
	
		local response = requestAsync({
			Url = url,
			Method = "GET",
		})
		assert(response.Success, "Download failed: " .. response.StatusCode .. " " .. response.StatusMessage)

		writefile(path, response.Body)
		github.updateVersions(function(data)
			data[id] = latestTag
		end)
	
		return path
	end

	---Downloads the given GitHub asset. Calls `onComplete` when finished.
	---@param user string
	---@param repo string
	---@param tag string
	---@param asset string
	---@return string
	function github.download(user, repo, tag, asset)
		local id = github.id(user, repo, tag, asset)
		local path = github.path(id)

		if isfile(path) then
			if tag == "latest" then
				task.defer(github.downloadLatest, user, repo, asset) -- Background update
			end
			return path
		elseif tag == "latest" then
			return github.downloadLatest(user, repo, asset)
		else
			local url = github.url(user, repo, tag, asset)
			local response = requestAsync({
				Url = url,
				Method = "GET",
			})
			assert(response.Success, "Download failed: " .. response.StatusCode .. " " .. response.StatusMessage)
			writefile(path, response.Body)
			return path
		end
	end
end

---Stores currently loading modules.
---@type table<LocalScript | ModuleScript, ModuleScript>
local currentlyLoading = {}

---Checks if requiring this module will result in a circular dependency.
---https://github.com/roblox-ts/roblox-ts/blob/master/lib/RuntimeLib.lua#L74
---@param module LocalScript | ModuleScript
---@param caller? LocalScript | ModuleScript
---@return function | nil
local function validateCurrentlyLoading(module, caller)
	currentlyLoading[caller] = module

	local currentModule = module
	local depth = 0

	-- If the module is loaded, requiring it will not cause a circular dependency.
	if not context.moduleToData[module] then
		while currentModule do
			depth = depth + 1
			currentModule = currentlyLoading[currentModule]

			if currentModule == module then
				local str = currentModule.Name -- Get the string traceback

				for _ = 1, depth do
					currentModule = currentlyLoading[currentModule]
					str = str .. "  ⇒ " .. currentModule.Name
				end

				error("Failed to load '" .. module.Name .. "'; Detected a circular dependency chain: " .. str, 2)
			end
		end
	end

	return function ()
		if currentlyLoading[caller] == module then -- Thread-safe cleanup!
			currentlyLoading[caller] = nil
		end
	end
end

---Loads the given module if it has not been loaded. Throws an error if a
---circular dependency is found.
---@param module LocalScript | ModuleScript
---@param this? LocalScript | ModuleScript
---@return any
local function loadModule(module, this)
	local cleanup = this and validateCurrentlyLoading(module, this)

	if context.moduleToData[module] then
		if cleanup then
			cleanup()
		end
		return context.moduleToData[module].data
	else
		local data = context.modules[context.instanceToId[module]]()
		context.moduleToData[module] = { data = data }
		if cleanup then
			cleanup()
		end
		return data
	end
end

---Returns or loads the given module. If the module is not created by rbxmSuite,
---it will return the result of `require(module)`. Used in `createModuleEnvironment`.
---@param module ModuleScript
---@param this? LocalScript | ModuleScript
---@return any
local function requireModuleInternal(module, this)
	if context.instanceToId[module] and module:IsA("ModuleScript") then
		return loadModule(module, this)
	else
		return require(module)
	end
end

---Creates a mock global environment for the given script.
---@param id number
---@param noCircularDeps boolean
---@return table<string, any>
local function createModuleEnvironment(id, noCircularDeps)
	return setmetatable({
		script = context.idToInstance[id],
		require = function (module)
			if noCircularDeps then
				return requireModuleInternal(module, context.idToInstance[id])
			else
				return requireModuleInternal(module)
			end
		end,
	}, {
		__index = getfenv(0),
		__metatable = "This metatable is locked",
	})
end

---Appends code that registers the given module to `out`.
---@param object LocalScript | ModuleScript
---@param path string
---@param out string[]
local function writeModule(object, path, out)
	context.currentId = context.currentId + 1
	context.idToInstance[context.currentId] = object
	context.instanceToId[object] = context.currentId

	local id = context.currentId
	local noCircularDeps = tostring(context.options.nocirculardeps)

	if context.options.debug then
		local code = table.concat({
			"context.modules[", id, "] = function()",
			"local fn = assert(loadstring(context.idToInstance[", id, "].Source, '@'..", string.format("%q", path), "))",
			"setfenv(fn, createModuleEnvironment(", id, ", ", noCircularDeps, "))",
			"return fn()",
			"end\n\n",
		}, "\n")
		table.insert(out, code)
	else
		local code = table.concat({
			"context.modules[", id, "] = function()",
			object.Source,
			"end",
			"setfenv(context.modules[", id, "], createModuleEnvironment(", id, ", ", noCircularDeps, "))\n\n",
		}, "\n")
		table.insert(out, code)
	end
end

---Appends the code of every module in the given object tree to `out`.
---@param tree Instance
---@param out string[]
---@return number
local function writeModules(tree, out)
	local initialId = context.currentId + 1
	if tree:IsA("LocalScript") or tree:IsA("ModuleScript") then
		writeModule(tree, PROGRAM_NAME .. "." .. tree:GetFullName(), out)
	end
	for _, object in ipairs(tree:GetDescendants()) do
		if object:IsA("LocalScript") or object:IsA("ModuleScript") then
			writeModule(object, PROGRAM_NAME .. "." .. object:GetFullName(), out)
		end
	end
	return initialId
end

---Initializes every module listed by `writeModule`. Returns the initial id.
---@param out string[]
local function initModules(out)
	local environment = setmetatable({
		context = context,
		createModuleEnvironment = createModuleEnvironment
	}, {
		__index = getfenv(0)
	})
	local init = assert(loadstring(table.concat(out, ""), "@" .. PROGRAM_NAME))
	setfenv(init, environment)()
end

---Downloads a GitHub Release asset. Calls `onComplete` with the file path.
---@param repo string user/repo@tag or latest
---@param asset string File name of the .rbxm(x) asset to download
---@return string
function rbxmSuite.download(repository, asset)
	local user, repo, tag = string.match(repository, "([^/]+)/([^@]+)@?(.*)")
	assert(user and repo, "Invalid repository: " .. repository)
	return github.download(user, repo, tag or "latest", asset)
end

---Clears and replaces the downloaded asset cache.
function rbxmSuite.repair()
	github.repair()
end

---Runs the given script or module and returns the result.
---@param script LocalScript | ModuleScript
---@return any
function rbxmSuite.require(script)
	assert(typeof(script) == "Instance", "Script expected")
	assert(script:IsA("LuaSourceContainer"), "Script expected")
	assert(context.instanceToId[script], "Script " .. script:GetFullName() .. " is not registered by this session");
	return loadModule(script)
end

---Inserts the model at `location` into the game. Initializes all scripts & modules.
---Returns the first instance created by the model.
---@param location string
---@param options? Options
---@return Instance
function rbxmSuite.launch(location, options)
	options = options or {}
	context.options = options
	do
		-- Defaults
		if options.debug == nil then options.debug = false end
		if options.runscripts == nil then options.runscripts = true end
		if options.verbose == nil then options.verbose = false end
		if options.nocirculardeps == nil then options.nocirculardeps = true end
	end

	log("Launching file '" .. location .. "'")
	for k, v in pairs(options) do
		local tabs = string.rep(" ", 11 - #k)
		log("  \"" .. k .. "\"", tabs, "=", v)
	end

	local clock = os.clock()

	local objects = game:GetObjects(fileAsContent(location))
	assert(type(objects) == "table", objects or "Failed to load model at " .. location)
	assert(typeof(objects[1]) == "Instance", "Model must contain at least one instance")

	-- Register every script in the model
	local moduleOutput = {}
	local initialId = writeModules(objects[1], moduleOutput)
	initModules(moduleOutput)

	log("Compiled", context.currentId - initialId + 1, "modules")

	-- Run every LocalScript object
	if options.runscripts then
		log("Scanning objects for LocalScripts")

		for i = initialId, context.currentId do
			local object = context.idToInstance[i]
			if object:IsA("LocalScript") and not object.Disabled then
				task.defer(loadModule, object)
				log(i - initialId + 1, "/", context.currentId - initialId + 1, ":", object:GetFullName())
			end
		end
	end

	log("Done in", (os.clock() - clock) * 1000, "milliseconds")

	context.options = nil
	return table.unpack(objects)
end

if isfolder(CACHE_FOLDER_NAME) then
	github.init()
end

return rbxmSuite
