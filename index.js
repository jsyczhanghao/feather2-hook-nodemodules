var path = require('path');
var all;

function _findResource(name, path){
	var extList = feather.config.get('component.ext', []);
	var info = feather.uri(name, path);

	for(var i = 0, len = extList.length; i < len && !info.file; i++){
		info = feather.uri(name + extList[i], path);
	}

	return info;
}

function findResource(name, dir){
	var list = [
		name,
		path.join(name, 'index'),
		path.join(name, path.basename(name))
	];
	var info;

	while(list.length){
		name = list.shift();
		info = _findResource(name, dir);

		if(info && info.file){
			break;
		}
	}

	return info;
}

function getModuleDir(path){
	var match = /^\/?(.*\/node_modules\/[^\/]+\/)/.exec(path);
	return match ? match[1] : '';
}

function onFileLookUp(info, file){
	if(!file) return;

	if(!info.file){
		var rest = info.rest, resolved;

		if(rest[0] == '.'){
			resolved = findResource(rest, file.dirname);
		}else{
			var match = /^([0-9a-zA-Z\-_]+)(?:\/(.+))?$/.exec(rest);

			if(!match) return;

			var package = match[1];
			var subpath = match[2];
			var dir = getModuleDir(file.subpath);
			var needFindDirs = [];
			var packageDir, root = feather.project.getProjectPath() + '/';

			if(dir){
				var p = path.join(dir, 'node_modules', package);

				if(feather.util.exists(root +p)){
					packageDir = p;
				}
			}

			if(!packageDir){
				packageDir = path.join('node_modules', package);

				if(!feather.util.exists(root + packageDir)){
					return;
				}
			}

			if(!subpath){	
				var configPath = root + packageDir + '/package.json';

				if(feather.util.exists(configPath)){
					subpath = feather.util.readJSON(configPath).main;
				}
			}

			resolved = findResource(path.join(packageDir, subpath || ''), root);
		}

		if(resolved.file){
			info.file = resolved.file;
			info.id = resolved.file.id;
		}
	}

	if(info.file && /node_modules/.test(info.file.id)){
		var subpath = info.file.subpath;

		if(all.src[subpath]){
			info.file = all.src[subpath];
		}else{
			all.src[subpath] = info.file;
			feather.compile(info.file);
		}

		file.derived.push(subpath);
	}
}

module.exports = function(feather, opts){
	feather.on('release:start', function(ret){
		all = ret;
	});

	feather.on('compile:end', function(file){
		if(file.derived.length){
			file.derived = file.derived.map(function(obj){
				if(typeof obj == 'string'){
					if(all.src[obj]){
						return all.src[obj];
					}else{
						return feather.project.lookup(obj, file).file;
					}
				}else{
					return obj;
				}
			});
		}
	});
	
	feather.on('lookup:file', onFileLookUp);
};