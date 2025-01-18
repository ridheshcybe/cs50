import fs from "fs";
import path from "path";

const data = fs.readFileSync(path.resolve("./views/track50.js")).toString('utf-8')

/**
 * Compile the file
 * @param {{[x:string]:{type: 'string'|'boolean'|'object'|'int', value: string}}} vars 
 */
export function compile(vars = {}) {
    const lines = data.split(/\n/g)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/😯(.*?)😯/);

        if (match) {
            const variableName = match[1];
            if (Reflect.has(vars, variableName) && vars[variableName]) {
                const value = vars[variableName];
                let out = ``;
                switch (value.type) {
                    case "object":
                        out = `JSON.parse(${value.value})`
                        break;
                    case "int":
                    case "boolean":
                        out = value.value;
                        break;
                    case "string":
                    default:
                        out = `"${value.value}"`
                        break;
                }
                lines[i] = `const ${variableName} = ${out};`
            }
        }
    }
    return lines.join('\n');
}