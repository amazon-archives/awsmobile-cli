const path = require('path')
const fs = jest.genMockFromModule('fs-extra')

var fsDetails = {}

function __setMockFiles(newMockFileInfos) {
    fsDetails = {}
    let singleMtime = new Date()
    for (const itemPath in newMockFileInfos) {
        var dirPath = path.dirname(itemPath)
        if(newMockFileInfos[itemPath]){
            fsDetails[itemPath] = { 
                content: newMockFileInfos[itemPath], 
                isFile: function(){ return true }, 
                isDirectory: function(){ return false},
                mtime: singleMtime
            }
            if (!fsDetails[dirPath]){
                fsDetails[dirPath] = {
                    content: [path.basename(itemPath)], 
                    isFile: function(){ return false }, 
                    isDirectory: function(){ return true},
                    mtime: singleMtime
                }
            }else{
                fsDetails[dirPath].content.push(path.basename(itemPath))
            }
        }else{
            fsDetails[itemPath] = { 
                content: null, 
                isFile: function(){ return false }, 
                isDirectory: function(){ return true},
                mtime: singleMtime
            }
            dirPath = itemPath
        }

        do{
            var parentPath = path.dirname(dirPath)
            if(parentPath == dirPath){
                break
            }else{
                if (!fsDetails[parentPath]){
                    fsDetails[parentPath] = {
                        content: [path.basename(dirPath)], 
                        isFile: function(){ return false }, 
                        isDirectory: function(){ return true},
                        mtime: singleMtime
                    }
                }else if(!fsDetails[parentPath].content.includes(path.basename(dirPath))){
                    fsDetails[parentPath].content.push(path.basename(dirPath))
                }
            }
            dirPath = parentPath
        }while(true)      
    }
}

function readdirSync(directoryPath) {
    var result 
    if(fsDetails[directoryPath] && fsDetails[directoryPath].isDirectory()){
        result = fsDetails[directoryPath].content
    }
    return result
}

function readFileSync(filePath) {
    var result 
    if(fsDetails[filePath] && fsDetails[filePath].isFile()){
        result = fsDetails[filePath].content
    }
    return result
}

fs.__setMockFiles = __setMockFiles
fs.readdirSync = jest.fn((path)=>{
    return readdirSync(path)
})
fs.lstatSync = jest.fn((path)=>{
    return fsDetails[path]
})
fs.statSync = jest.fn((path)=>{
    return fsDetails[path]
})
fs.readFileSync = readFileSync
fs.existsSync = jest.fn((path)=>{
    return fsDetails.hasOwnProperty(path)
})
fs.writeFileSync = jest.fn()
fs.appendFileSync = jest.fn()
fs.rmdirSync = jest.fn()
fs.renameSyn = jest.fn()
fs.emptyDirSync = jest.fn()
fs.copySync = jest.fn()
fs.mkdirSync = jest.fn()
fs.ensureDirSync = jest.fn()
fs.createReadStream = jest.fn()
fs.createWriteStream = jest.fn()

module.exports = fs