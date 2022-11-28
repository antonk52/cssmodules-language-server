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

Example uses [`nvim-lspconfig`](https://github.com/neovim/nvim-lspconfig)

```lua
require'lspconfig'.cssmodules_ls.setup {
    -- provide your on_attach to bind keymappings
    on_attach = custom_on_attach,
    -- optionally
    init_options = {
        camelCase = 'dashes',
    },
}
```

**Known issue**: if you have multiple LSP that provide hover and go-to-definition support, there can be races(example typescript and cssmodules-language-server work simultaneously). As a workaround you can disable **definition** in favor of **implementation** to avoid conflicting with typescript's go-to-definition.

```lua
require'lspconfig'.cssmodules_ls.setup {
    on_attach = function (client)
        -- avoid accepting `go-to-definition` responses from this LSP
        client.server_capabilities.goto_definition = false
        custom_on_attach(client)
    end,
}
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
