const fs = require('fs');
const path = require('path');
const { inflateSync } = require('zlib');
const xml2js = require('xml2js');

function toRuntimeImagePath(absPath) {
	// Convert an absolute path under resources/ to a runtime web path under assets/resources/
	const resourcesIdx = absPath.split(path.sep).lastIndexOf('resources');
	if (resourcesIdx !== -1) {
		const parts = absPath.split(path.sep).slice(resourcesIdx + 1);
		return ['assets', 'resources', ...parts].join('/');
	}
	// Fallback: return as-is
	return absPath.replace(/\\/g, '/');
}

async function parseTsx(tsxPath) {
	const xml = fs.readFileSync(tsxPath, 'utf8');
	const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false, mergeAttrs: true });
	const ts = parsed.tileset;
	const image = ts.image || {};
	const imageSource = image.source ? path.resolve(path.dirname(tsxPath), image.source) : '';
	return {
		tilewidth: parseInt(ts.tilewidth, 10),
		tileheight: parseInt(ts.tileheight, 10),
		tilecount: ts.tilecount ? parseInt(ts.tilecount, 10) : undefined,
		columns: ts.columns ? parseInt(ts.columns, 10) : undefined,
		margin: ts.margin ? parseInt(ts.margin, 10) : 0,
		spacing: ts.spacing ? parseInt(ts.spacing, 10) : 0,
		image: toRuntimeImagePath(imageSource),
		imagewidth: image.width ? parseInt(image.width, 10) : undefined,
		imageheight: image.height ? parseInt(image.height, 10) : undefined,
	};
}

async function main() {
	const [,, inputPath, outputPathArg] = process.argv;
	if (!inputPath) {
		console.error('Usage: node scripts/convert_tmx_to_json.js <input.tmx> [output.json]');
		process.exit(1);
	}
	const outputPath = outputPathArg || path.join('assets', 'maps', 'overworld.json');

	const xml = fs.readFileSync(inputPath, 'utf8');
	const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false, mergeAttrs: true });
	const map = parsed.map;
	const width = parseInt(map.width, 10);
	const height = parseInt(map.height, 10);
	const tilewidth = parseInt(map.tilewidth, 10);
	const tileheight = parseInt(map.tileheight, 10);

	// Tilesets (resolve TSX files)
	const tilesets = [];
	const mapTilesets = Array.isArray(map.tileset) ? map.tileset : (map.tileset ? [map.tileset] : []);
	for (const ts of mapTilesets) {
		const firstgid = parseInt(ts.firstgid, 10);
		let tsInfo = {};
		if (ts.source) {
			const tsxPath = path.resolve(path.dirname(inputPath), ts.source);
			tsInfo = await parseTsx(tsxPath);
		} else {
			// Inline tileset in TMX (rare in Tuxemon)
			const image = ts.image || {};
			const imageSourceAbs = image.source ? path.resolve(path.dirname(inputPath), image.source) : '';
			tsInfo = {
				tilewidth: parseInt(ts.tilewidth, 10),
				tileheight: parseInt(ts.tileheight, 10),
				tilecount: ts.tilecount ? parseInt(ts.tilecount, 10) : undefined,
				columns: ts.columns ? parseInt(ts.columns, 10) : undefined,
				margin: ts.margin ? parseInt(ts.margin, 10) : 0,
				spacing: ts.spacing ? parseInt(ts.spacing, 10) : 0,
				image: toRuntimeImagePath(imageSourceAbs),
				imagewidth: image.width ? parseInt(image.width, 10) : undefined,
				imageheight: image.height ? parseInt(image.height, 10) : undefined,
			};
		}
		tilesets.push({ firstgid, ...tsInfo });
	}

	// Layers (tilelayers + objectgroups)
	const layers = [];
	const mapLayers = [];
	if (Array.isArray(map.layer)) mapLayers.push(...map.layer);
	else if (map.layer) mapLayers.push(map.layer);
	if (Array.isArray(map.objectgroup)) mapLayers.push(...map.objectgroup);
	else if (map.objectgroup) mapLayers.push(map.objectgroup);

	for (const layer of mapLayers) {
		if (layer.type === 'objectgroup' || layer.object) {
			const objects = [];
			const src = Array.isArray(layer.object) ? layer.object : (layer.object ? [layer.object] : []);
			for (const obj of src) {
				let props = {};
				if (obj.properties && obj.properties.property) {
					const arr = Array.isArray(obj.properties.property) ? obj.properties.property : [obj.properties.property];
					arr.forEach(p => {
						const key = p.name || p.$?.name;
						let val = p.value || p.$?.value;
						if (val === undefined && p._ !== undefined) val = p._;
						if (key) props[key] = val;
					});
				}
				objects.push({
					name: obj.name || '',
					type: obj.type || (layer.name || ''),
					x: parseFloat(obj.x || 0),
					y: parseFloat(obj.y || 0),
					width: parseFloat(obj.width || 0),
					height: parseFloat(obj.height || 0),
					props
				});
			}
			layers.push({ type: 'objectgroup', name: layer.name || 'Objects', objects });
			continue;
		}

		if (!layer.data) continue;
		const enc = layer.data.encoding || 'csv';
		const comp = layer.data.compression || '';
		let dataArray = [];
		if (enc === 'base64') {
			const b64 = (layer.data._ || layer.data).trim();
			let buf = Buffer.from(b64, 'base64');
			if (comp === 'zlib') {
				buf = inflateSync(buf);
			}
			for (let i = 0; i < buf.length; i += 4) {
				dataArray.push(buf.readUInt32LE(i));
			}
		} else if (enc === 'csv') {
			const csv = (layer.data._ || layer.data).trim();
			dataArray = csv.split(/\s*,\s*/).map(n => parseInt(n, 10));
		} else {
			console.warn(`Unsupported encoding: ${enc}. Layer ${layer.name} skipped.`);
			continue;
		}
		layers.push({
			type: 'tilelayer',
			name: layer.name || 'Layer',
			width: parseInt(layer.width || width, 10),
			height: parseInt(layer.height || height, 10),
			data: dataArray
		});
	}

	const out = { width, height, tilewidth, tileheight, tilesets, layers };
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	fs.writeFileSync(outputPath, JSON.stringify(out));
	console.log(`Wrote ${outputPath} from ${inputPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
