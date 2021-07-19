--
-- TODO: Implement TestEZ & virtual fs
--

rbxmSuite.Project.fromGitHub("Roblox/roact@v1.4.0", "Roact.rbxm")
	:andThen(function()
		print("Roblox/roact@v1.4.0 OK")
	end)

rbxmSuite.Project.fromGitHub("Roblox/roact@latest", "Roact.rbxm")
	:andThen(function()
		print("Roblox/roact@latest OK")
	end)

rbxmSuite.Project.fromGitHub("Roblox/roact@latest#deferred", "Roact.rbxm")
	:andThen(function()
		print("Roblox/roact@latest#deferred OK")
	end)
