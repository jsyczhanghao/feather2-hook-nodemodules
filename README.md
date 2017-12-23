feather2-hook-nodemodules
===============================

解决feather2支持查找node_modules模块的hook

## 使用

```sh
npm install feather2-hook-nodemodules --save-dev
```

```js
//conf.js
//先卸载原有hook,  注，必须注销
feather.config.unhook('components');
//注册nodemodules模块查找
feather.config.hook('nodemodules');
//支持查找es6，vue
feather.config.set('project.fileType.js', ['es6', 'vue']);
```

```js
require.async('vue');
```

```sh
feather2 release
```