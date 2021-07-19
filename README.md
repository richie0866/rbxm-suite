<h1 align="center">
	<br>
	<a href="https://google.com">
		<img src="logo.png" alt="rbxm">
	</a>
	<br>
	rbxmSuite
	<br>
</hi>

<h4 align="center">A Roblox rbxm(x) file runtime built for exploiting</h4>

<p align="center">
	<a href="https://github.com/richie0866/rbxm-suite/actions/workflows/release.yml">
		<img src="https://github.com/richie0866/rbxm-suite/actions/workflows/release.yml/badge.svg" alt="GitHub Actions Release Status">
	</a>
	<a href="https://github.com/richie0866/rbxm-suite/actions/workflows/ci.yml">
		<img src="https://github.com/richie0866/rbxm-suite/actions/workflows/ci.yml/badge.svg" alt="GitHub Actions CI Status">
	</a>
	<a href="https://github.com/richie0866/rbxm-suite/releases/latest">
		<img src="https://img.shields.io/github/v/release/richie0866/rbxm-suite?include_prereleases" alt="Latest Release">
	</a>
</span>

## ⚡ Features

🔌 Asset downloader - Retrieve and cache model files from GitHub Releases

🌿 Roblox-like script runtime - Special `script` and `require` variables

🧬 Cross-project module usage

❌ Verbose errors for cyclic dependencies

<br/>


## 🌻 Motivation

While [Rostruct](https://github.com/richie0866/Rostruct) can load simple stand-alone projects, it **falls short with Rojo project files**.

Rostruct also **always rebuilds your project at runtime**, which is excessive. Rojo is a much better tool for building your project files.

By moving the build process upstream with Rojo, you can take full advantage of a **true Rojo workflow**.

<br/>


## 🔌 Installation

You can load rbxmSuite through a GitHub Release:

``` lua
local rbxmSuite = loadstring(
	game:HttpGetAsync("https://github.com/richie0866/rbxm-suite/releases/download/TAG_NAME/rbxmSuite.lua")
)()

-- Use rbxmSuite
```

You can also download `rbxmSuite.lua` and modify it yourself:

``` lua
local rbxmSuite = (function()

	-- Minified code

)()

-- Use rbxmSuite
```

<br/>


## ❓ What's rbxmSuite?

`rbxmSuite` is the spiritual successor to Rostruct, designed for **only rbxm(x) file runtime**.

No need to build several files at runtime. **Just plug in a model file, that's it!**

<br/>


## ✨ Supported workflows

### ⚡ Rojo
* Build your projects to Roblox model files with [Rojo](https://rojo.space).

### ⚡ TypeScript
* Write, compile, and build your code with [roblox-ts](https://roblox-ts.com) (must be the `model` type!)

<br/>


## 📜 Usage

<details>
<summary>
👩🏾‍💻 <strong>Run a project</strong>
</summary>

> ``` ts
> function project:start(): Promise<LocalScript[]>
> ```
>
> Executes every script in the model, and returns a Promise that resolves with every script that ran.
>
> The Promise only resolves **after** each script finishes running on the **main thread** (max 10-sec timeout).
> 
> If **one script** throws an error on the **main thread**, the entire Promise will cancel.

```lua
local project = rbxmSuite.Project.new("path/to/Project.rbxm")

project:start()
```

</details>

---


<details>
<summary>
👩🏾‍💻 <strong>Require a specific module</strong>
</summary>

> ``` ts
> function project:require(module: ModuleScript): Promise<unknown>
> ```
> 
> Requires the module, and returns a Promise that resolves with what the module returned.
> 
> `module` must be a ModuleScript created by the Project!
> 
```lua
local project = rbxmSuite.Project.new("path/to/Project.rbxm")
local myModule = project.instance.Modules.MyModule

project:require(myModule)
	:andThen(function(MyModule)
		-- Use module
	end)
```

> Wait for the module to require with `Promise.expect`:
> 
```lua
local project = rbxmSuite.Project.new("path/to/Project.rbxm")
local myModule = project.instance.Modules.MyModule

local MyModule = project:require(myModule):expect()
```

> Note that the root `instance` can also be a module, if you'd like to distribute a library!

</details>

---


<details>
<summary>
👩🏾‍💻 <strong>Retrieve a project from GitHub</strong>
</summary>

> Release format: `"owner/repo@tag#flags"`

> **`@tag`**
> 
> Downloads the release asset for this version **once**.
> 
> If `Roact.rbxm` exists in the cache, the Promise will instantly resolve.
```lua
rbxmSuite.Project.fromGitHub("Roblox/roact@v1.4.0", "Roact.rbxm"):expect()
```

> **`@latest`**
> 
> Automatically downloads and updates the asset to the latest version.
> 
> This function **always** yields to check the latest version!
```lua
rbxmSuite.Project.fromGitHub("Roblox/roact@latest", "Roact.rbxm"):expect()
```

> **`deferred`**
> 
> If `Roact.rbxm` exists in the cache, the Promise will instantly resolve.
> 
> Processes like version-checking and downloading will happen in the background, unless this is a first-time download.
> 
> The `deferred` flag can only be used with the `@latest` tag!
```lua
rbxmSuite.Project.fromGitHub("Roblox/roact@latest#deferred", "Roact.rbxm"):expect()
```

</details>
<br/>


## Limitations

### ☢️ Large file size

Since this module is written in TypeScript, it depends on some roblox-ts packages and modules.

The project's minified Luau output is ~40kb. As a result, it is larger than a stand-alone Luau implementation.
