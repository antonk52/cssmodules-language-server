# cssmodules-language-server

Language server for `autocompletion` and `go-to-definition` functionality for css modules.

<p align="center"><img src="https://user-images.githubusercontent.com/5817809/76164832-0adaf600-6163-11ea-8c8e-548b7aeb1213.gif"></p>

Features:

- **definition** jumps to class name under cursor.
- **implementation** (works the same as definition).
- **hover** provides comments before the class name with direct declarations within the class name.

The supported languages are `css`(postcss), `sass` and `scss`. `styl` files are parsed as regular `css`.

## Installation

```sh
npm install --global cssmodules-language-server
```

## Configuration

See if your editor supports language servers or if there is a plugin to add support for language servers

### Neovim

Example uses [`nvim-lspconfig`](https://github.com/neovim/lspconfig)

```lua
local configs = require'lspconfig/configs'

if not configs.cssmodules then
    configs.cssmodules = {
        default_config = {
            cmd = {'cssmodules-language-server'},
            filetypes = {'javascript', 'javascriptreact', 'typescript', 'typescriptreact'},
            init_options = {
                camelCase = 'dashes',
            },
            root_dir = require('lspconfig.util').root_pattern('package.json')
        },
        docs = {
            description = 'TODO description',
            default_config = {
                root_dir = '[[root_pattern("package.json")]]'
            }
        }
    }
end

configs.cssmodules.setup {}
-- or
-- configs.cssmodules.setup {on_attach = custom_on_attach}
```

### [coc.nvim](https://github.com/neoclide/coc.nvim)

```vim
let cssmodules_config = {
\ "command": "cssmodules-language-server",
\ "initializationOptions": {"camelCase": "dashes"},
\ "filetypes": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
\ "requireRootPattern": 0,
\ "settings": {}
\ }
coc#config('languageserver.cssmodules', cssmodules_config)
```

## Initialization options

### `camelCase`

If you write kebab-case classes in css files, but want to get camelCase complete items, set following to true.

```json
{
   "camelCase": true
}
```

You can set the `cssmodules.camelCase` option to `true`, `"dashes"` or `false`(default).

| Classname in css file | `true`            | `dashes`        | `false`(default)  |
| --------------------- | ----------------- | --------------- | ----------------- |
| `.button`             | `.button`         | `.button`       | `.button`         |
| `.btn__icon--mod`     | `.btnIconMod`     | `.btn__iconMod` | `.btn__icon--mod` |


## Acknowledgments

This plugin was extracted from [`coc-cssmodules`](https://github.com/antonk52/coc-cssmodules) as a standalone language server.
