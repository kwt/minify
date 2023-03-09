const fs = require("fs")
const path = require("path")
const { minify } = require("luamin")
const fse = require('fs-extra')


function *walkSync(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        if (file.isDirectory()) yield* walkSync(path.join(dir, file.name));
        else yield path.join(dir, file.name);
    }
}


const serverStarter = {
    shouldBuild(resourceName) {
        return (GetResourceMetadata(resourceName, 'minify', 0) === 'yes')
    },
    build(resourceName, cb) {
        const resourcePath = GetResourcePath(resourceName)
        const clientProdPath = path.join(resourcePath, 'client_prod')
        var err = false

        if (fs.existsSync(clientProdPath)) fs.rmSync(clientProdPath, { recursive: true, force: true })
        else fs.mkdirSync(clientProdPath)
        
        fse.copySync(path.join(resourcePath, 'client'), clientProdPath)
        
        for (const filePath of walkSync(clientProdPath)) {
            if (filePath.endsWith('.lua')) {
                try {
                    const fileContent = fs.readFileSync(filePath, 'utf8')
                    const minifiedFileContent = minify(fileContent, { comments: false })
                    fs.writeFileSync(filePath, minifiedFileContent)
                } catch (error) {
                    err = "^1"+error.toString()+`\nFile: ${filePath}^7`
                }
            }
        }

        if (err != false) cb(false, err)
        else cb(true)
    }

}

RegisterResourceBuildTaskFactory(GetCurrentResourceName(), () => serverStarter)